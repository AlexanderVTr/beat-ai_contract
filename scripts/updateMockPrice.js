/**
 * Скрипт для обновления цены BTC в мок-оракуле
 * Использование: NEW_PRICE=90000 npx hardhat run scripts/updateMockPrice.js --network polygon_amoy
 * Пример: NEW_PRICE=90000 npx hardhat run scripts/updateMockPrice.js --network polygon_amoy
 */

require('dotenv').config();
const { ethers } = require("hardhat");

// ABI для интерфейса мок-оракула
const MOCK_ORACLE_ABI = [
  "function setPrice(int256 _newPrice) external",
  "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
  "function decimals() external view returns (uint8)"
];

async function main() {
  try {
    // Получаем адрес мок-оракула из переменных окружения
    const mockPriceFeedAddress = process.env.MOCK_PRICE_FEED_ADDRESS;
    if (!mockPriceFeedAddress) {
      throw new Error("MOCK_PRICE_FEED_ADDRESS не указан в .env файле");
    }

    // Получаем новую цену из переменной окружения
    const newPriceStr = process.env.NEW_PRICE;
    if (!newPriceStr) {
      throw new Error("Не указана новая цена. Пример использования: NEW_PRICE=90000 npx hardhat run scripts/updateMockPrice.js --network polygon_amoy");
    }
    
    const newPrice = parseInt(newPriceStr);
    if (isNaN(newPrice) || newPrice <= 0) {
      throw new Error("Некорректная цена. Цена должна быть положительным числом.");
    }

    console.log(`Обновление цены BTC в мок-оракуле (${mockPriceFeedAddress}) на $${newPrice}`);

    // Получаем провайдер и кошелек
    const [signer] = await ethers.getSigners();
    console.log(`Используется аккаунт: ${signer.address}`);
    
    // Подключаемся к контракту мок-оракула
    const mockPriceFeed = new ethers.Contract(mockPriceFeedAddress, MOCK_ORACLE_ABI, signer);

    // Получаем текущую цену
    const roundData = await mockPriceFeed.latestRoundData();
    const decimals = await mockPriceFeed.decimals();
    const currentPrice = Number(roundData[1]) / (10 ** Number(decimals));
    
    console.log(`Текущая цена BTC: $${currentPrice.toFixed(2)}`);
    console.log(`Новая цена BTC: $${newPrice.toFixed(2)}`);
    console.log(`Изменение: ${((newPrice - currentPrice) / currentPrice * 100).toFixed(2)}%`);
    
    // Устанавливаем новую цену
    console.log("Отправка транзакции...");
    const tx = await mockPriceFeed.setPrice(newPrice);
    console.log(`Транзакция отправлена: ${tx.hash}`);
    
    await tx.wait();
    console.log("Транзакция подтверждена!");
    
    // Проверяем, что цена обновилась
    const updatedRoundData = await mockPriceFeed.latestRoundData();
    const updatedPrice = Number(updatedRoundData[1]) / (10 ** Number(decimals));
    console.log(`Обновленная цена BTC: $${updatedPrice.toFixed(2)}`);
    console.log(`Новый раунд ID: ${updatedRoundData[0]}`);
    
    console.log("Цена успешно обновлена!");

  } catch (error) {
    console.error("Ошибка при обновлении цены:", error);
    process.exit(1);
  }
}

// Запускаем скрипт
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 