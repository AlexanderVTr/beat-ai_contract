// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RealEstateEscrow {
    // Структура для хранения информации о сделке
    struct Deal {
        address buyer;
        address seller;
        address realtor;
        uint256 price;
        bool buyerApproved;
        bool sellerApproved;
        bool isCompleted;
        bool isRefunded;
        address paymentToken; // Адрес токена для оплаты (address(0) для ETH)
    }

    // Структура для отслеживания средств
    struct DealFunds {
        uint256 amount;
        uint256 depositTime;
        bool isLocked;
    }

    // Роли в системе
    address public owner; // Владелец контракта (компания)
    address public platformAdmin; // Администратор платформы
    mapping(address => bool) public realtors; // Авторизованные риелторы
    mapping(address => bool) public supportedTokens; // Поддерживаемые токены

    // Комиссии
    uint256 public platformFee = 1; // Комиссия платформы (1%)
    uint256 public realtorFee = 2; // Комиссия риелтора (2%)

    // Счетчик сделок
    uint256 public dealCounter;

    // Маппинги для хранения данных
    mapping(uint256 => Deal) public deals;
    mapping(uint256 => DealFunds) public dealFunds;

    // Флаг паузы
    bool public paused;

    // События
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    event AdminChanged(address indexed previousAdmin, address indexed newAdmin);
    event RealtorAdded(address indexed realtor);
    event RealtorRemoved(address indexed realtor);
    event FeesUpdated(uint256 platformFee, uint256 realtorFee);
    event DealCreated(
        uint256 dealId,
        address buyer,
        address seller,
        address realtor,
        uint256 price,
        address paymentToken
    );
    event DealApproved(uint256 dealId, address approver);
    event DealCompleted(uint256 dealId);
    event DealRefunded(uint256 dealId);
    event FundsDeposited(uint256 dealId, uint256 amount);
    event FundsReceived(uint256 dealId, uint256 amount, uint256 timestamp);
    event FundsDistributed(
        uint256 dealId,
        uint256 sellerAmount,
        uint256 realtorAmount,
        uint256 platformAmount
    );
    event FundsRefunded(uint256 dealId, uint256 amount, address buyer);
    event TokenSupported(address indexed token);
    event TokenRemoved(address indexed token);

    constructor() {
        owner = msg.sender;
        platformAdmin = msg.sender;
    }

    // Модификаторы
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == platformAdmin, "Only admin");
        _;
    }

    modifier onlyRealtor() {
        require(realtors[msg.sender], "Only authorized realtor");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // Функции управления платформой
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setAdmin(address newAdmin) external onlyOwner {
        require(newAdmin != address(0), "Invalid address");
        emit AdminChanged(platformAdmin, newAdmin);
        platformAdmin = newAdmin;
    }

    function addRealtor(address realtor) external onlyAdmin {
        require(realtor != address(0), "Invalid address");
        realtors[realtor] = true;
        emit RealtorAdded(realtor);
    }

    function removeRealtor(address realtor) external onlyAdmin {
        realtors[realtor] = false;
        emit RealtorRemoved(realtor);
    }

    function updateFees(
        uint256 _platformFee,
        uint256 _realtorFee
    ) external onlyOwner {
        require(_platformFee + _realtorFee <= 5, "Total fee too high"); // Максимум 5%
        platformFee = _platformFee;
        realtorFee = _realtorFee;
        emit FeesUpdated(_platformFee, _realtorFee);
    }

    function togglePause() external onlyOwner {
        paused = !paused;
    }

    // Функции управления токенами
    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        supportedTokens[token] = true;
        emit TokenSupported(token);
    }

    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
        emit TokenRemoved(token);
    }

    // Основные функции контракта
    function createDeal(
        address _seller,
        address _realtor,
        uint256 _price,
        address _paymentToken
    ) external whenNotPaused returns (uint256) {
        require(_seller != address(0), "Invalid seller address");
        require(_realtor != address(0), "Invalid realtor address");
        require(_price > 0, "Price must be greater than 0");
        require(realtors[_realtor], "Realtor not authorized");
        require(
            _paymentToken == address(0) || supportedTokens[_paymentToken],
            "Token not supported"
        );

        uint256 dealId = dealCounter++;

        deals[dealId] = Deal({
            buyer: msg.sender,
            seller: _seller,
            realtor: _realtor,
            price: _price,
            buyerApproved: false,
            sellerApproved: false,
            isCompleted: false,
            isRefunded: false,
            paymentToken: _paymentToken
        });

        emit DealCreated(
            dealId,
            msg.sender,
            _seller,
            _realtor,
            _price,
            _paymentToken
        );
        return dealId;
    }

    function depositFunds(uint256 _dealId) external payable whenNotPaused {
        Deal storage deal = deals[_dealId];
        require(msg.sender == deal.buyer, "Only buyer can deposit");
        require(!deal.isCompleted, "Deal is already completed");
        require(!deal.isRefunded, "Deal is refunded");
        require(!dealFunds[_dealId].isLocked, "Funds already locked");
        require(deal.paymentToken == address(0), "Use token deposit function");
        require(msg.value == deal.price, "Incorrect amount");

        dealFunds[_dealId] = DealFunds({
            amount: msg.value,
            depositTime: block.timestamp,
            isLocked: true
        });

        emit FundsDeposited(_dealId, msg.value);
        emit FundsReceived(_dealId, msg.value, block.timestamp);
    }

    function depositTokenFunds(
        uint256 _dealId,
        uint256 _amount
    ) external whenNotPaused {
        Deal storage deal = deals[_dealId];
        require(msg.sender == deal.buyer, "Only buyer can deposit");
        require(!deal.isCompleted, "Deal is already completed");
        require(!deal.isRefunded, "Deal is refunded");
        require(!dealFunds[_dealId].isLocked, "Funds already locked");
        require(deal.paymentToken != address(0), "Use ETH deposit function");
        require(_amount == deal.price, "Incorrect amount");

        IERC20(deal.paymentToken).transferFrom(
            msg.sender,
            address(this),
            _amount
        );

        dealFunds[_dealId] = DealFunds({
            amount: _amount,
            depositTime: block.timestamp,
            isLocked: true
        });

        emit FundsDeposited(_dealId, _amount);
        emit FundsReceived(_dealId, _amount, block.timestamp);
    }

    function approveDeal(uint256 _dealId) external whenNotPaused {
        Deal storage deal = deals[_dealId];
        require(!deal.isCompleted, "Deal is already completed");
        require(!deal.isRefunded, "Deal is refunded");
        require(dealFunds[_dealId].isLocked, "Funds not locked");

        if (msg.sender == deal.buyer) {
            deal.buyerApproved = true;
        } else if (msg.sender == deal.seller) {
            deal.sellerApproved = true;
        } else {
            revert("Not a participant");
        }

        emit DealApproved(_dealId, msg.sender);

        if (deal.buyerApproved && deal.sellerApproved) {
            completeDeal(_dealId);
        }
    }

    function completeDeal(uint256 _dealId) private {
        Deal storage deal = deals[_dealId];
        DealFunds storage funds = dealFunds[_dealId];

        require(funds.isLocked, "Funds not locked");
        require(funds.amount == deal.price, "Fund amount mismatch");

        deal.isCompleted = true;
        funds.isLocked = false;

        uint256 platformFeeAmount = (funds.amount * platformFee) / 100;
        uint256 realtorFeeAmount = (funds.amount * realtorFee) / 100;
        uint256 sellerAmount = funds.amount -
            platformFeeAmount -
            realtorFeeAmount;

        if (deal.paymentToken == address(0)) {
            // ETH transfer
            require(
                address(this).balance >= funds.amount,
                "Contract balance too low"
            );
            payable(deal.seller).transfer(sellerAmount);
            payable(deal.realtor).transfer(realtorFeeAmount);
            payable(owner).transfer(platformFeeAmount);
        } else {
            // Token transfer
            IERC20 token = IERC20(deal.paymentToken);
            require(
                token.balanceOf(address(this)) >= funds.amount,
                "Contract token balance too low"
            );
            token.transfer(deal.seller, sellerAmount);
            token.transfer(deal.realtor, realtorFeeAmount);
            token.transfer(owner, platformFeeAmount);
        }

        emit DealCompleted(_dealId);
        emit FundsDistributed(
            _dealId,
            sellerAmount,
            realtorFeeAmount,
            platformFeeAmount
        );
    }

    function emergencyRefund(uint256 _dealId) external onlyOwner {
        Deal storage deal = deals[_dealId];
        DealFunds storage funds = dealFunds[_dealId];

        require(funds.isLocked, "Funds not locked");
        require(!deal.isCompleted, "Deal already completed");

        uint256 refundAmount = funds.amount;
        funds.isLocked = false;
        funds.amount = 0;
        deal.isRefunded = true;

        if (deal.paymentToken == address(0)) {
            payable(deal.buyer).transfer(refundAmount);
        } else {
            IERC20(deal.paymentToken).transfer(deal.buyer, refundAmount);
        }

        emit DealRefunded(_dealId);
        emit FundsRefunded(_dealId, refundAmount, deal.buyer);
    }

    // View функции
    function getDeal(
        uint256 _dealId
    )
        external
        view
        returns (
            address buyer,
            address seller,
            address realtor,
            uint256 price,
            bool buyerApproved,
            bool sellerApproved,
            bool isCompleted,
            bool isRefunded,
            address paymentToken
        )
    {
        Deal storage deal = deals[_dealId];
        return (
            deal.buyer,
            deal.seller,
            deal.realtor,
            deal.price,
            deal.buyerApproved,
            deal.sellerApproved,
            deal.isCompleted,
            deal.isRefunded,
            deal.paymentToken
        );
    }

    function getDealFundsInfo(
        uint256 _dealId
    )
        external
        view
        returns (
            uint256 amount,
            uint256 depositTime,
            bool isLocked,
            uint256 timeElapsed
        )
    {
        DealFunds storage funds = dealFunds[_dealId];
        return (
            funds.amount,
            funds.depositTime,
            funds.isLocked,
            block.timestamp - funds.depositTime
        );
    }

    function calculateFundDistribution(
        uint256 _dealId
    )
        external
        view
        returns (
            uint256 sellerAmount,
            uint256 realtorAmount,
            uint256 platformAmount
        )
    {
        DealFunds storage funds = dealFunds[_dealId];

        platformAmount = (funds.amount * platformFee) / 100;
        realtorAmount = (funds.amount * realtorFee) / 100;
        sellerAmount = funds.amount - platformAmount - realtorAmount;

        return (sellerAmount, realtorAmount, platformAmount);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getContractTokenBalance(
        address token
    ) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    // Защита от случайных переводов
    receive() external payable {
        revert("Direct ETH transfers not allowed");
    }

    fallback() external payable {
        revert("Function doesn't exist");
    }
}
