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
      console.log("⚠️ Вы не являетесь владельцем контракта! Только владелец может изменить период ставок.");
      return;
    }
    
    // Проверяем статус раунда
    const status = await contract.getRoundStatus();
    console.log(`Текущий статус раунда: ${status}`);
    
    if (status !== "WAITING_TO_START" && status !== "READY_FOR_RESOLUTION") {
      console.log("⚠️ Невозможно изменить период ставок во время активного раунда.");
      return;
    }
    
    // Получаем текущий период ставок
    const currentBettingPeriod = await contract.bettingPeriod();
    console.log(`Текущий период ставок: ${Number(currentBettingPeriod) / 60} минут`);
    
    // Устанавливаем новый период ставок (1 час = 3600 секунд)
    const newBettingPeriod = 3600;
    console.log(`Новый период ставок: ${newBettingPeriod / 60} минут`);
    
    // Отправляем транзакцию
    console.log("Отправляем транзакцию...");
    const tx = await contract.setBettingPeriod(newBettingPeriod);
    console.log(`Транзакция отправлена: ${tx.hash}`);
    console.log("Ожидаем подтверждения...");
    
    await tx.wait();
    console.log("✅ Период ставок успешно изменен!");
    
    // Проверяем новый период ставок
    const newPeriod = await contract.bettingPeriod();
    console.log(`Новый период ставок: ${Number(newPeriod) / 60} минут`);
    
  } catch (error) {
    console.error("Ошибка при изменении периода ставок:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 