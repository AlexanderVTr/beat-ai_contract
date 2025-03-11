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
      console.log("⚠️ Вы не являетесь владельцем контракта! Только владелец может изменить задержку результата.");
      return;
    }
    
    // Проверяем статус раунда
    const status = await contract.getRoundStatus();
    console.log(`Текущий статус раунда: ${status}`);
    
    if (status !== "WAITING_TO_START" && status !== "READY_FOR_RESOLUTION") {
      console.log("⚠️ Невозможно изменить задержку результата во время активного раунда.");
      return;
    }
    
    // Получаем текущую задержку результата
    const currentResultDelay = await contract.resultDelay();
    console.log(`Текущая задержка результата: ${Number(currentResultDelay) / 60} минут`);
    
    // Устанавливаем новую задержку результата (15 минут = 900 секунд)
    const newResultDelay = 900;
    console.log(`Новая задержка результата: ${newResultDelay / 60} минут`);
    
    // Отправляем транзакцию
    console.log("Отправляем транзакцию...");
    const tx = await contract.setResultDelay(newResultDelay);
    console.log(`Транзакция отправлена: ${tx.hash}`);
    console.log("Ожидаем подтверждения...");
    
    await tx.wait();
    console.log("✅ Задержка результата успешно изменена!");
    
    // Проверяем новую задержку результата
    const newDelay = await contract.resultDelay();
    console.log(`Новая задержка результата: ${Number(newDelay) / 60} минут`);
    
  } catch (error) {
    console.error("Ошибка при изменении задержки результата:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 