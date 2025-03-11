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
      console.log("⚠️ Вы не являетесь владельцем контракта! Только владелец может изменить время начала раунда.");
      return;
    }
    
    // Проверяем статус раунда
    const status = await contract.getRoundStatus();
    console.log(`Текущий статус раунда: ${status}`);
    
    if (status !== "WAITING_TO_START") {
      console.log("⚠️ Раунд не в статусе WAITING_TO_START. Невозможно изменить время начала.");
      return;
    }
    
    // Получаем текущее время начала раунда
    const currentRoundStart = await contract.currentRoundStart();
    console.log(`Текущее время начала раунда: ${new Date(Number(currentRoundStart) * 1000).toLocaleString()}`);
    
    // Сбрасываем раунд с текущим временем
    console.log("\nУстанавливаем время начала раунда на текущее время...");
    
    // Используем resetCurrentRound, который установит время начала на текущее время + 5 минут
    const tx = await contract.resetCurrentRound();
    console.log(`Транзакция отправлена: ${tx.hash}`);
    console.log("Ожидаем подтверждения...");
    
    await tx.wait();
    console.log("✅ Время начала раунда успешно изменено!");
    
    // Проверяем новое время начала раунда
    const newRoundStart = await contract.currentRoundStart();
    console.log(`Новое время начала раунда: ${new Date(Number(newRoundStart) * 1000).toLocaleString()}`);
    
    // Проверяем новый статус
    const newStatus = await contract.getRoundStatus();
    console.log(`Новый статус раунда: ${newStatus}`);
    
  } catch (error) {
    console.error("Ошибка при изменении времени начала раунда:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 