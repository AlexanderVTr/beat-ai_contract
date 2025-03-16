// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Chainlink interface for BTC price feed
// This interface allows getting real-time price data from Chainlink oracle
interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract BTCBettingPolygon {
    // Main contract state variables
    address public owner; // Contract owner address
    uint256 public bettingPeriod = 22 hours; // Betting period duration (default 22 hours)
    uint256 public resultDelay = 2 hours; // Time between betting end and result (default 2 hours)
    uint256 public currentRoundStart; // Start time of current round
    uint256 public feePercentage = 75; // Contract fee (7.5%, multiplied by 10 for precision)
    uint256 public roundNumber; // Current round number

    // Minimum values for time periods to ensure contract security
    uint256 public constant MIN_BETTING_PERIOD = 5 minutes; // Minimum betting period (for testing)
    uint256 public constant MIN_RESULT_DELAY = 1 minutes; // Minimum result delay (for testing)

    // Structure to store bet information
    struct Bet {
        address player; // Player's address
        uint256 amount; // Bet amount
        uint256 predictedPrice; // Predicted BTC price
        uint256 round; // Round number for this bet
    }

    // Mapping from round number to bets
    mapping(uint256 => Bet[]) public roundBets;
    // Mapping from round number to AI prediction
    mapping(uint256 => uint256) public roundAIPredictions;
    // Mapping from round number to prediction status
    mapping(uint256 => bool) public roundAIPredictionSet;

    // Interface for BTC price feed from Chainlink
    AggregatorV3Interface internal btcPriceFeed;

    // Events
    event NewRoundStarted(
        uint256 indexed roundNumber,
        uint256 startTime,
        uint256 endTime
    );
    event BetPlaced(
        uint256 indexed roundNumber,
        address indexed player,
        uint256 amount,
        uint256 predictedPrice
    );
    event RoundResolved(
        uint256 indexed roundNumber,
        uint256 actualPrice,
        address[] winners,
        uint256[] winningAmounts,
        uint256 totalPrizePool
    );
    event BettingPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event ResultDelayUpdated(uint256 oldDelay, uint256 newDelay);

    // Contract constructor
    constructor(
        address _priceFeed,
        uint256 _initialBettingPeriod,
        uint256 _initialResultDelay
    ) {
        owner = msg.sender;
        btcPriceFeed = AggregatorV3Interface(_priceFeed);

        // Устанавливаем периоды из параметров конструктора
        require(
            _initialBettingPeriod >= MIN_BETTING_PERIOD,
            "Betting period too short"
        );
        require(
            _initialResultDelay >= MIN_RESULT_DELAY,
            "Result delay too short"
        );
        bettingPeriod = _initialBettingPeriod;
        resultDelay = _initialResultDelay;

        // Начинаем раунд сразу после деплоя
        currentRoundStart = block.timestamp;
        roundNumber = 1;

        // Эмитим событие о начале первого раунда
        emit NewRoundStarted(
            roundNumber,
            currentRoundStart,
            currentRoundStart + bettingPeriod
        );
    }

    // Calculate next round start time (5 minutes from now for testing)
    function _getNextRoundStart() private view returns (uint256) {
        // Для тестирования: следующий раунд начинается через 5 минут после текущего времени
        return block.timestamp + 5 minutes;

        // Закомментированная оригинальная логика (19:00 UTC ежедневно)
        /*
        uint256 timestamp = block.timestamp;
        uint256 secondsInDay = 24 hours;
        uint256 targetHour = 19 hours; // 19:00 UTC (14:00 EST)

        // Get the start of the current day
        uint256 startOfDay = timestamp - (timestamp % secondsInDay);
        uint256 targetTime = startOfDay + targetHour;

        // If target time has passed, move to next day
        if (timestamp >= targetTime) {
            targetTime += secondsInDay;
        }

        return targetTime;
        */
    }

    // Access control modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier duringBettingPeriod() {
        require(block.timestamp >= currentRoundStart, "Round not started");
        require(
            block.timestamp < currentRoundStart + bettingPeriod,
            "Betting closed"
        );
        _;
    }

    modifier afterBettingEnds() {
        require(
            block.timestamp >= currentRoundStart + bettingPeriod + resultDelay,
            "Too early"
        );
        _;
    }

    // Function to update betting period (only owner)
    function setBettingPeriod(uint256 _newBettingPeriod) external onlyOwner {
        require(_newBettingPeriod >= MIN_BETTING_PERIOD, "Period too short");

        // Ensure we can't change the period during an active round
        string memory status = getRoundStatus();
        require(
            keccak256(abi.encodePacked(status)) ==
                keccak256(abi.encodePacked("WAITING_TO_START")) ||
                keccak256(abi.encodePacked(status)) ==
                keccak256(abi.encodePacked("READY_FOR_RESOLUTION")),
            "Cannot change during active round"
        );

        uint256 oldPeriod = bettingPeriod;
        bettingPeriod = _newBettingPeriod;
        emit BettingPeriodUpdated(oldPeriod, _newBettingPeriod);
    }

    // Function to update result delay (only owner)
    function setResultDelay(uint256 _newResultDelay) external onlyOwner {
        require(_newResultDelay >= MIN_RESULT_DELAY, "Delay too short");

        // Ensure we can't change the delay during an active round
        string memory status = getRoundStatus();
        require(
            keccak256(abi.encodePacked(status)) ==
                keccak256(abi.encodePacked("WAITING_TO_START")) ||
                keccak256(abi.encodePacked(status)) ==
                keccak256(abi.encodePacked("READY_FOR_RESOLUTION")),
            "Cannot change during active round"
        );

        uint256 oldDelay = resultDelay;
        resultDelay = _newResultDelay;
        emit ResultDelayUpdated(oldDelay, _newResultDelay);
    }

    // Function to place a bet
    function placeBet(
        uint256 _predictedPrice
    ) external payable duringBettingPeriod {
        require(msg.value >= 0.1 ether, "Minimum bet is 0.1 MATIC");
        roundBets[roundNumber].push(
            Bet({
                player: msg.sender,
                amount: msg.value,
                predictedPrice: _predictedPrice,
                round: roundNumber
            })
        );
        emit BetPlaced(roundNumber, msg.sender, msg.value, _predictedPrice);
    }

    // Function to set AI prediction
    function setAIPrediction(
        uint256 _aiPrediction
    ) external onlyOwner duringBettingPeriod {
        require(
            !roundAIPredictionSet[roundNumber],
            "AI prediction already set"
        );
        roundAIPredictions[roundNumber] = _aiPrediction;
        roundAIPredictionSet[roundNumber] = true;
    }

    // Get current BTC price from Chainlink
    function getBTCPrice() public view returns (uint256) {
        // Get the price data from Chainlink
        (
            uint80 roundId,
            int256 price, // startedAt not used
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = btcPriceFeed.latestRoundData();

        // Safety checks
        require(price > 0, "Invalid price");
        require(updatedAt > 0, "Round not complete");
        require(answeredInRound >= roundId, "Stale price");

        // Check if the price is not too old (1 hour max)
        require(block.timestamp - updatedAt <= 1 hours, "Price too old");

        // Convert price from Chainlink format (8 decimals) to standard format
        return uint256(price / 1e8);
    }

    // View function to get last price update time
    function getLastPriceUpdateTime() public view returns (uint256) {
        (, , , uint256 updatedAt, ) = btcPriceFeed.latestRoundData();
        return updatedAt;
    }

    // Function to determine winners and start new round
    function determineWinnersAndStartNewRound()
        external
        onlyOwner
        afterBettingEnds
    {
        uint256 currentRound = roundNumber;
        require(roundBets[currentRound].length > 0, "No bets placed");
        require(roundAIPredictionSet[currentRound], "AI prediction not set");

        uint256 actualPrice = getBTCPrice();
        uint256 bestDifference = type(uint256).max;
        address[] memory winners = new address[](
            roundBets[currentRound].length
        );
        uint256[] memory winnerAmounts = new uint256[](
            roundBets[currentRound].length
        );
        uint256 winnerCount = 0;
        uint256 totalPrizePool = 0;

        // Calculate total prize pool
        for (uint i = 0; i < roundBets[currentRound].length; i++) {
            totalPrizePool += roundBets[currentRound][i].amount;
        }

        // Get AI's prediction accuracy
        uint256 aiDifference = absDiff(
            roundAIPredictions[currentRound],
            actualPrice
        );

        // First pass: find the best difference among all bets
        for (uint i = 0; i < roundBets[currentRound].length; i++) {
            uint256 difference = absDiff(
                roundBets[currentRound][i].predictedPrice,
                actualPrice
            );
            if (difference < bestDifference) {
                bestDifference = difference;
            }
        }

        // Second pass: collect only the winners who beat AI AND achieved the best difference
        if (bestDifference < aiDifference) {
            // Calculate prize pool after fee (using 7.5% fee)
            uint256 prizePoolAfterFee = (totalPrizePool * 925) / 1000;

            // First collect all winners
            for (uint i = 0; i < roundBets[currentRound].length; i++) {
                uint256 difference = absDiff(
                    roundBets[currentRound][i].predictedPrice,
                    actualPrice
                );
                if (difference == bestDifference) {
                    winners[winnerCount] = roundBets[currentRound][i].player;
                    winnerAmounts[winnerCount] = roundBets[currentRound][i]
                        .amount;
                    winnerCount++;
                }
            }

            // If there's only one winner, they get the entire prize pool after fee
            if (winnerCount == 1) {
                payable(winners[0]).transfer(prizePoolAfterFee);
            }
            // If there are multiple winners, distribute proportionally to their bet amounts
            else if (winnerCount > 1) {
                uint256 totalWinningBets = 0;
                for (uint i = 0; i < winnerCount; i++) {
                    totalWinningBets += winnerAmounts[i];
                }

                for (uint i = 0; i < winnerCount; i++) {
                    uint256 winnerShare = (prizePoolAfterFee *
                        winnerAmounts[i]) / totalWinningBets;
                    payable(winners[i]).transfer(winnerShare);
                }
            }

            // Transfer remaining balance (fees) to owner
            payable(owner).transfer(address(this).balance);
        } else {
            // AI won - entire prize pool goes to owner
            payable(owner).transfer(totalPrizePool);
        }

        // Trim arrays to actual winner count for the event
        address[] memory finalWinners = new address[](winnerCount);
        uint256[] memory finalWinningAmounts = new uint256[](winnerCount);
        for (uint i = 0; i < winnerCount; i++) {
            finalWinners[i] = winners[i];
            finalWinningAmounts[i] = winnerAmounts[i];
        }

        emit RoundResolved(
            currentRound,
            actualPrice,
            finalWinners,
            finalWinningAmounts,
            totalPrizePool
        );

        // Start new round
        currentRoundStart = _getNextRoundStart();
        roundNumber++;
        emit NewRoundStarted(
            roundNumber,
            currentRoundStart,
            currentRoundStart + bettingPeriod
        );
    }

    // Helper function to calculate absolute difference
    function absDiff(uint256 a, uint256 b) private pure returns (uint256) {
        return a > b ? a - b : b - a;
    }

    // View functions
    function getCurrentRoundEndTime() public view returns (uint256) {
        return currentRoundStart + bettingPeriod;
    }

    function getResultTime() public view returns (uint256) {
        return currentRoundStart + bettingPeriod + resultDelay;
    }

    function getCurrentRoundBets() public view returns (Bet[] memory) {
        return roundBets[roundNumber];
    }

    // Additional view functions for better UX
    function getCurrentRoundInfo()
        public
        view
        returns (
            uint256 roundNum,
            uint256 startTime,
            uint256 endTime,
            uint256 resultTime,
            uint256 totalBets,
            uint256 totalPrizePool,
            bool isAIPredictionSet
        )
    {
        roundNum = roundNumber;
        startTime = currentRoundStart;
        endTime = getCurrentRoundEndTime();
        resultTime = getResultTime();
        totalBets = roundBets[roundNumber].length;

        // Calculate total prize pool for current round
        totalPrizePool = 0;
        for (uint i = 0; i < roundBets[roundNumber].length; i++) {
            totalPrizePool += roundBets[roundNumber][i].amount;
        }

        isAIPredictionSet = roundAIPredictionSet[roundNumber];
    }

    function getRoundStatus() public view returns (string memory) {
        if (block.timestamp < currentRoundStart) {
            return "WAITING_TO_START";
        } else if (block.timestamp < currentRoundStart + bettingPeriod) {
            return "BETTING_OPEN";
        } else if (
            block.timestamp < currentRoundStart + bettingPeriod + resultDelay
        ) {
            return "WAITING_FOR_RESULT";
        } else {
            return "READY_FOR_RESOLUTION";
        }
    }

    function getTimeUntilNextPhase() public view returns (uint256) {
        if (block.timestamp < currentRoundStart) {
            return currentRoundStart - block.timestamp;
        } else if (block.timestamp < currentRoundStart + bettingPeriod) {
            return (currentRoundStart + bettingPeriod) - block.timestamp;
        } else if (
            block.timestamp < currentRoundStart + bettingPeriod + resultDelay
        ) {
            return
                (currentRoundStart + bettingPeriod + resultDelay) -
                block.timestamp;
        } else {
            return 0;
        }
    }

    // Calculate potential winnings for a given bet amount
    function calculatePotentialWinnings(
        uint256 betAmount
    )
        public
        view
        returns (
            uint256 minWinning, // Minimum potential winning (if many winners)
            uint256 maxWinning, // Maximum potential winning (if single winner)
            uint256 currentPool // Current total prize pool including your potential bet
        )
    {
        require(betAmount >= 0.1 ether, "Minimum bet is 0.1 MATIC");

        // Calculate current pool + your bet
        currentPool = betAmount;
        for (uint i = 0; i < roundBets[roundNumber].length; i++) {
            currentPool += roundBets[roundNumber][i].amount;
        }

        // Calculate prize pool after fee
        uint256 prizePoolAfterFee = (currentPool * (100 - feePercentage)) / 100;

        // Minimum winning: if you share the prize with all current bettors
        uint256 totalCurrentBets = betAmount;
        for (uint i = 0; i < roundBets[roundNumber].length; i++) {
            totalCurrentBets += roundBets[roundNumber][i].amount;
        }
        minWinning = (prizePoolAfterFee * betAmount) / totalCurrentBets;

        // Maximum winning: if you're the only winner
        maxWinning = (prizePoolAfterFee * betAmount) / betAmount; // Same as prizePoolAfterFee

        return (minWinning, maxWinning, currentPool);
    }

    // Get detailed stats for a specific player's bets in current round
    function getPlayerCurrentRoundStats(
        address player
    )
        public
        view
        returns (
            uint256 totalBets, // Number of bets placed
            uint256 totalAmount, // Total amount bet
            uint256[] memory prices // Array of predicted prices
        )
    {
        uint256 count = 0;
        totalAmount = 0;

        // First pass: count bets and total amount
        for (uint i = 0; i < roundBets[roundNumber].length; i++) {
            if (roundBets[roundNumber][i].player == player) {
                count++;
                totalAmount += roundBets[roundNumber][i].amount;
            }
        }

        // Initialize prices array
        prices = new uint256[](count);

        // Second pass: fill prices array
        uint256 j = 0;
        for (uint i = 0; i < roundBets[roundNumber].length && j < count; i++) {
            if (roundBets[roundNumber][i].player == player) {
                prices[j] = roundBets[roundNumber][i].predictedPrice;
                j++;
            }
        }

        return (count, totalAmount, prices);
    }

    // Function to reset current round (only owner)
    function resetCurrentRound() external onlyOwner {
        // Start new round
        currentRoundStart = _getNextRoundStart();
        roundNumber++;

        // Reset round data
        delete roundBets[roundNumber];
        roundAIPredictionSet[roundNumber] = false;
        delete roundAIPredictions[roundNumber];

        emit NewRoundStarted(
            roundNumber,
            currentRoundStart,
            currentRoundStart + bettingPeriod
        );
    }
}
