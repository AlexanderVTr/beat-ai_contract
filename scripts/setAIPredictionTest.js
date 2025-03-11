const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  try {
    // Адрес вашего контракта
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      console.error("Установите CONTRACT_ADDRESS в .env файле");
      return;
    }
    
    // Получаем аккаунты
    const [deployer] = await ethers.getSigners();
    console.log(`Используем аккаунт: ${deployer.address}`);
    
    // Подключаемся к контракту
    const BTCBettingPolygon = await ethers.getContractFactory("BTCBettingPolygon");
    const contract = await BTCBettingPolygon.attach(contractAddress);
    
    // Проверяем, являемся ли мы владельцем контракта
    const owner = await contract.owner();
    console.log(`Владелец контракта: ${owner}`);
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("⚠️ Вы не являетесь владельцем контракта! Только владелец может устанавливать прогноз AI.");
      return;
    }
    
    // Проверяем статус раунда
    const status = await contract.getRoundStatus();
    console.log(`Текущий статус раунда: ${status}`);
    
    if (status !== "BETTING_OPEN") {
      console.log("⚠️ Раунд не открыт для ставок. Невозможно установить прогноз AI.");
      return;
    }
    
    // Проверяем, установлен ли уже прогноз AI
    const roundNumber = await contract.roundNumber();
    const isAIPredictionSet = await contract.roundAIPredictionSet(roundNumber);
    
    if (isAIPredictionSet) {
      console.log("⚠️ Прогноз AI уже установлен для текущего раунда.");
      return;
    }
    
    // Получаем текущую цену BTC
    const btcPrice = await contract.getBTCPrice();
    console.log(`Текущая цена BTC: ${btcPrice.toString()} USD`);
    
    // Устанавливаем прогноз AI (прогноз: текущая цена + 200)
    const aiPrediction = parseInt(btcPrice.toString()) + 200;
    console.log(`Устанавливаем прогноз AI: ${aiPrediction} USD`);
    
    // Отправляем транзакцию
    console.log("Отправляем транзакцию...");
    const tx = await contract.setAIPrediction(aiPrediction);
    console.log(`Транзакция отправлена: ${tx.hash}`);
    console.log("Ожидаем подтверждения...");
    
    await tx.wait();
    console.log("✅ Прогноз AI успешно установлен!");
    
    // Проверяем, что прогноз AI был установлен
    const newIsAIPredictionSet = await contract.roundAIPredictionSet(roundNumber);
    console.log(`Прогноз AI установлен: ${newIsAIPredictionSet}`);
    
    if (newIsAIPredictionSet) {
      const aiPredictionValue = await contract.roundAIPredictions(roundNumber);
      console.log(`Значение прогноза AI: ${aiPredictionValue.toString()} USD`);
    }
    
  } catch (error) {
    console.error("Ошибка при установке прогноза AI:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 