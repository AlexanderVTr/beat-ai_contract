const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  // Адрес вашего контракта
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("Установите CONTRACT_ADDRESS в .env файле");
    return;
  }
  
  // Подключаемся к контракту
  const BTCBettingPolygon = await ethers.getContractFactory("BTCBettingPolygon");
  const contract = await BTCBettingPolygon.attach(contractAddress);
  
  // Получаем статус раунда
  const status = await contract.getRoundStatus();
  console.log(`Текущий статус раунда: ${status}`);
  
  try {
    // Получаем информацию о текущем раунде
    const roundInfo = await contract.getCurrentRoundInfo();
    console.log("Информация о текущем раунде:");
    console.log(`  Номер раунда: ${roundInfo.roundNum.toString()}`);
    console.log(`  Время начала: ${new Date(Number(roundInfo.startTime) * 1000).toLocaleString()}`);
    console.log(`  Время окончания ставок: ${new Date(Number(roundInfo.endTime) * 1000).toLocaleString()}`);
    console.log(`  Время результата: ${new Date(Number(roundInfo.resultTime) * 1000).toLocaleString()}`);
    console.log(`  Количество ставок: ${roundInfo.totalBets.toString()}`);
    console.log(`  Общий призовой фонд: ${ethers.utils.formatEther(roundInfo.totalPrizePool)} MATIC`);
    console.log(`  Прогноз AI установлен: ${roundInfo.isAIPredictionSet}`);
  } catch (error) {
    console.error("Ошибка при получении информации о раунде:", error.message);
  }
  
  try {
    // Получаем значения переменных состояния
    const roundNumber = await contract.roundNumber();
    const currentRoundStart = await contract.currentRoundStart();
    const bettingPeriod = await contract.bettingPeriod();
    const resultDelay = await contract.resultDelay();
    
    console.log("\nСостояние контракта:");
    console.log(`  Номер текущего раунда: ${roundNumber.toString()}`);
    console.log(`  Время начала текущего раунда: ${new Date(Number(currentRoundStart) * 1000).toLocaleString()}`);
    console.log(`  Период ставок: ${Number(bettingPeriod) / 60} минут`);
    console.log(`  Задержка результата: ${Number(resultDelay) / 60} минут`);
    
    // Проверяем, что раунд действительно начался
    if (roundNumber.toString() === "1" && currentRoundStart.toString() !== "0") {
      console.log("\n✅ Первый раунд успешно запущен!");
      
      // Проверяем статус раунда
      if (status === "READY_FOR_RESOLUTION") {
        console.log("⚠️ Раунд готов к разрешению. Вы можете вызвать функцию determineWinnersAndStartNewRound()");
      } else if (status === "BETTING_OPEN") {
        console.log("✅ Раунд открыт для ставок.");
      } else if (status === "WAITING_FOR_RESULT") {
        console.log("⏳ Раунд в ожидании результата.");
      } else if (status === "WAITING_TO_START") {
        console.log("⏳ Раунд ожидает начала.");
      }
    } else {
      console.log("\n❌ Первый раунд не был запущен или был уже завершен.");
    }
  } catch (error) {
    console.error("Ошибка при получении состояния контракта:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 