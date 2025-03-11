// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
require('dotenv').config();

// Адрес мок-оракула Chainlink для BTC/USD на Polygon Amoy
const MOCK_PRICE_FEED_ADDRESS = process.env.MOCK_PRICE_FEED_ADDRESS;

// Начальные значения для периодов (можно переопределить через переменные окружения)
const INITIAL_BETTING_PERIOD = process.env.INITIAL_BETTING_PERIOD || "22h"; // По умолчанию 22 часа
const INITIAL_RESULT_DELAY = process.env.INITIAL_RESULT_DELAY || "2h"; // По умолчанию 2 часа

// Функция для преобразования строки с временным интервалом в секунды
function parseTimeInterval(interval) {
  const value = parseInt(interval.slice(0, -1));
  const unit = interval.slice(-1).toLowerCase();
  
  switch (unit) {
    case 's': return value; // секунды
    case 'm': return value * 60; // минуты
    case 'h': return value * 60 * 60; // часы
    case 'd': return value * 24 * 60 * 60; // дни
    default: throw new Error(`Неизвестная единица времени: ${unit}`);
  }
}

// Преобразуем начальные значения в секунды
const initialBettingPeriodSeconds = parseTimeInterval(INITIAL_BETTING_PERIOD);
const initialResultDelaySeconds = parseTimeInterval(INITIAL_RESULT_DELAY);

module.exports = buildModule("BTCBettingWithMockDynamicModule", (m) => {
    console.log(`Деплой BTCBettingPolygon с использованием мок-оракула: ${MOCK_PRICE_FEED_ADDRESS}`);
    console.log(`Начальный период ставок: ${INITIAL_BETTING_PERIOD} (${initialBettingPeriodSeconds} секунд)`);
    console.log(`Начальная задержка результатов: ${INITIAL_RESULT_DELAY} (${initialResultDelaySeconds} секунд)`);
    
    // Проверяем, что адрес мок-оракула указан
    if (!MOCK_PRICE_FEED_ADDRESS) {
        throw new Error("MOCK_PRICE_FEED_ADDRESS не указан в .env файле");
    }

    // Деплоим контракт BTCBettingPolygon с мок-оракулом
    const btcBetting = m.contract("BTCBettingPolygon", [
        MOCK_PRICE_FEED_ADDRESS,
        initialBettingPeriodSeconds,
        initialResultDelaySeconds
    ]);

    return { btcBetting };
}); 