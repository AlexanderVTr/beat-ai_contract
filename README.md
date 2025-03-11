# BTC Betting Smart Contract

This project implements a Bitcoin price betting smart contract using Chainlink price feeds. Users can place bets on the future price of Bitcoin, and winners are determined based on the actual price from Chainlink oracles.

To setup price for mock contract
NEW_PRICE=92000 npx hardhat run scripts/updateMockPrice.js --network polygon_amoy

Setup round of the beating
INITIAL_BETTING_PERIOD=10m INITIAL_RESULT_DELAY=5m npx hardhat ignition deploy ./ignition/modules/deployWithMockDynamic.js --network polygon_amoy

## Architecture

This project uses a cross-chain architecture:

- **Contract Deployment**: The contract is deployed on **Polygon Amoy** testnet (with future plans to migrate to Polygon Mainnet)
- **Price Data Source**: BTC/USD price data is obtained from either:
  - Chainlink Price Feeds on the **Sepolia** testnet (for production)
  - Mock Chainlink Oracle on **Polygon Amoy** (for testing)

## Features

- Place bets on future BTC price
- AI prediction system for comparison
- Dynamic betting periods and result delays
- Automated winner determination
- Prize distribution based on prediction accuracy
- Owner fee system (configurable percentage)

## Chainlink Price Feeds Integration

This project uses Chainlink Price Feeds to get reliable, decentralized BTC/USD price data. The integration follows best practices from the [Chainlink documentation](https://docs.chain.link/data-feeds/using-data-feeds).

### Price Feed Addresses

The contract uses the following BTC/USD price feed addresses:

#### Testnets

- Sepolia: `0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43`
- Mock Oracle on Polygon Amoy: `0xBb9C1B4F5C5E6B25DFF93ff9Bd6A387c520c05c6`

#### Mainnets

- Ethereum: `0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c`

## Getting Started

### Prerequisites

- Node.js and npm
- Hardhat

### Installation

```shell
npm install
```

### Deploying the Contract

To deploy the contract to Polygon Amoy using Hardhat Ignition:

```shell
# Deploy with Sepolia price feed
npx hardhat ignition deploy ./ignition/modules/deploy.js --network polygon_amoy

# Deploy with Mock Oracle and dynamic periods
INITIAL_BETTING_PERIOD=10m INITIAL_RESULT_DELAY=5m npx hardhat ignition deploy ./ignition/modules/deployWithMockDynamic.js --network polygon_amoy
```

### Deploying the Mock Oracle

For testing purposes, you can deploy a mock Chainlink oracle:

```shell
npx hardhat run scripts/deployMockPriceFeed.js --network polygon_amoy
```

### Checking Contract Status

To check the status of the deployed contract:

```shell
npx hardhat run scripts/checkDynamicContract.js --network polygon_amoy
```

### Updating Mock Oracle Price

To update the BTC price in the mock oracle:

```shell
NEW_PRICE=92000 npx hardhat run scripts/updateMockPrice.js --network polygon_amoy
```

### Managing Betting Periods

To update the betting period and result delay:

```shell
# Update betting period to 10 minutes
BETTING_PERIOD=10m npx hardhat run scripts/updateTimePeriods.js --network polygon_amoy

# Update result delay to 5 minutes
RESULT_DELAY=5m npx hardhat run scripts/updateTimePeriods.js --network polygon_amoy

# Update both at once
BETTING_PERIOD=10m RESULT_DELAY=5m npx hardhat run scripts/updateTimePeriods.js --network polygon_amoy
```

## Implementation Details

The contract uses Chainlink's AggregatorV3Interface to fetch the latest BTC/USD price:

```solidity
// Get current BTC price from Chainlink
function getBTCPrice() public view returns (uint256) {
    // Get the price data from Chainlink
    (
        uint80 roundId,
        int256 price,
        ,
        uint256 updatedAt,
        uint80 answeredInRound
    ) = btcPriceFeed.latestRoundData();

    // Safety checks
    require(price > 0, "Invalid price");
    require(updatedAt > 0, "Round not complete");
    require(answeredInRound >= roundId, "Stale price");
    require(block.timestamp - updatedAt <= 1 hours, "Price too old");

    // Convert price from Chainlink format (8 decimals) to standard format
    return uint256(price / 1e8);
}
```

### Best Practices Implemented

1. **Data Validation**: The contract validates that the price is positive, the round is complete, and the data is not stale.
2. **Freshness Check**: Ensures the price data is not too old (less than 1 hour).
3. **Proper Decimal Handling**: Converts the price from Chainlink's format (with 8 decimals) to a standard format.
4. **Cross-Chain Architecture**: Deploys on Polygon Amoy but uses Sepolia for price data.
5. **Dynamic Periods**: Allows adjusting betting periods and result delays for easier testing.

## Automated Winner Determination

The project includes scripts for automatically determining winners and starting new rounds:

1. **scripts/determineWinners.js** - Script to check the round status and call the winner determination function when appropriate.

2. **scripts/setupCron.js** - Script to set up a cron job that will automatically run the winner determination script at a specified time each day.

### Setting Up Automation

1. First, make sure the necessary variables are specified in the `.env` file:

   ```
   PRIVATE_KEY=your_private_key
   CONTRACT_ADDRESS=your_contract_address
   CRON_TIME=5 21 * * *  # Default 21:05 UTC
   MOCK_PRICE_FEED_ADDRESS=mock_oracle_address  # For testing
   ```

2. Run the cron job setup script:

   ```
   node scripts/setupCron.js
   ```

3. Verify that the cron job is set up successfully:
   ```
   crontab -l
   ```

### Manual Execution of Winner Determination

You can also run the winner determination script manually:

```
npx hardhat run scripts/determineWinners.js --network polygon_amoy
```

The script will check the current round status and call the winner determination function only if the appropriate time has come.

## Additional Documentation

Detailed information about dynamic periods and testing is available in the [CONTRACT_INFO.md](./CONTRACT_INFO.md) file.

## License

This project is licensed under the MIT License.
