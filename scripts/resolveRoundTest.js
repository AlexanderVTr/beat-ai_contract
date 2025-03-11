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
      console.log("⚠️ Вы не являетесь владельцем контракта! Только владелец может определять победителей.");
      return;
    }
    
    // Проверяем статус раунда
    const status = await contract.getRoundStatus();
    console.log(`Текущий статус раунда: ${status}`);
    
    if (status !== "READY_FOR_RESOLUTION") {
      console.log("⚠️ Раунд не готов к разрешению. Невозможно определить победителей.");
      return;
    }
    
    // Получаем информацию о текущем раунде
    const roundNumber = await contract.roundNumber();
    console.log(`Текущий номер раунда: ${roundNumber}`);
    
    // Проверяем, установлен ли прогноз AI
    const isAIPredictionSet = await contract.roundAIPredictionSet(roundNumber);
    if (!isAIPredictionSet) {
      console.log("⚠️ Прогноз AI не установлен для текущего раунда. Невозможно определить победителей.");
      return;
    }
    
    // Получаем текущую цену BTC
    const btcPrice = await contract.getBTCPrice();
    console.log(`Текущая цена BTC: ${btcPrice.toString()} USD`);
    
    // Получаем прогноз AI
    const aiPrediction = await contract.roundAIPredictions(roundNumber);
    console.log(`Прогноз AI: ${aiPrediction.toString()} USD`);
    
    // Получаем количество ставок
    const bets = await contract.getCurrentRoundBets();
    console.log(`Количество ставок в текущем раунде: ${bets.length}`);
    
    if (bets.length === 0) {
      console.log("⚠️ В текущем раунде нет ставок. Невозможно определить победителей.");
      return;
    }
    
    // Определяем победителей и начинаем новый раунд
    console.log("Определяем победителей и начинаем новый раунд...");
    const tx = await contract.determineWinnersAndStartNewRound();
    console.log(`Транзакция отправлена: ${tx.hash}`);
    console.log("Ожидаем подтверждения...");
    
    await tx.wait();
    console.log("✅ Победители определены и новый раунд начат!");
    
    // Проверяем новый номер раунда
    const newRoundNumber = await contract.roundNumber();
    console.log(`Новый номер раунда: ${newRoundNumber}`);
    
    // Проверяем статус нового раунда
    const newStatus = await contract.getRoundStatus();
    console.log(`Статус нового раунда: ${newStatus}`);
    
  } catch (error) {
    console.error("Ошибка при определении победителей:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 