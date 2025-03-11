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
      console.log("⚠️ Вы не являетесь владельцем контракта! Только владелец может сбросить раунд.");
      return;
    }
    
    // Проверяем статус раунда
    const status = await contract.getRoundStatus();
    console.log(`Текущий статус раунда: ${status}`);
    
    // Получаем информацию о текущем раунде
    const roundNumber = await contract.roundNumber();
    const currentRoundStart = await contract.currentRoundStart();
    
    console.log("\nТекущее состояние контракта:");
    console.log(`  Номер текущего раунда: ${roundNumber.toString()}`);
    console.log(`  Время начала текущего раунда: ${new Date(Number(currentRoundStart) * 1000).toLocaleString()}`);
    
    // Сбрасываем раунд
    console.log("\nСбрасываем текущий раунд...");
    const tx = await contract.resetCurrentRound();
    console.log(`Транзакция отправлена: ${tx.hash}`);
    console.log("Ожидаем подтверждения...");
    
    await tx.wait();
    console.log("✅ Раунд успешно сброшен!");
    
    // Проверяем новое состояние
    const newRoundStart = await contract.currentRoundStart();
    console.log(`Новое время начала раунда: ${new Date(Number(newRoundStart) * 1000).toLocaleString()}`);
    
    // Проверяем новый статус
    const newStatus = await contract.getRoundStatus();
    console.log(`Новый статус раунда: ${newStatus}`);
    
  } catch (error) {
    console.error("Ошибка при сбросе раунда:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 