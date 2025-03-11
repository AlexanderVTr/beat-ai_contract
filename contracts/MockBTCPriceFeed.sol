// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockBTCPriceFeed
 * @dev Имитация оракула Chainlink для BTC/USD
 * Используется для тестирования контракта BTCBettingPolygon на Polygon Amoy
 */
contract MockBTCPriceFeed {
    // Текущая цена BTC в USD (с 8 десятичными знаками, как в Chainlink)
    int256 private btcPrice;

    // Время последнего обновления цены
    uint256 private updatedAt;

    // Текущий ID раунда
    uint80 private roundId;

    /**
     * @dev Конструктор
     * @param _initialPrice Начальная цена BTC в USD (без десятичных знаков)
     */
    constructor(int256 _initialPrice) {
        // Устанавливаем начальную цену с 8 десятичными знаками
        btcPrice = _initialPrice * 1e8;
        updatedAt = block.timestamp;
        roundId = 1;
    }

    /**
     * @dev Устанавливает новую цену BTC
     * @param _newPrice Новая цена BTC в USD (без десятичных знаков)
     */
    function setPrice(int256 _newPrice) external {
        btcPrice = _newPrice * 1e8;
        updatedAt = block.timestamp;
        roundId++;
    }

    /**
     * @dev Возвращает последние данные о цене BTC
     * Имитирует интерфейс AggregatorV3Interface.latestRoundData()
     */
    function latestRoundData()
        external
        view
        returns (
            uint80 _roundId,
            int256 answer,
            uint256 startedAt,
            uint256 _updatedAt,
            uint80 answeredInRound
        )
    {
        return (roundId, btcPrice, updatedAt, updatedAt, roundId);
    }

    /**
     * @dev Возвращает количество десятичных знаков в цене
     * Имитирует интерфейс AggregatorV3Interface.decimals()
     */
    function decimals() external pure returns (uint8) {
        return 8;
    }

    /**
     * @dev Возвращает описание оракула
     * Имитирует интерфейс AggregatorV3Interface.description()
     */
    function description() external pure returns (string memory) {
        return "Mock BTC / USD";
    }
}
