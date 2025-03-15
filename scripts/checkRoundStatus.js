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
    console.log("\nИнформация о текущем раунде:");
    console.log(`  Номер раунда: ${roundInfo.roundNum.toString()}`);
    console.log(`  Время начала: ${new Date(Number(roundInfo.startTime) * 1000).toLocaleString()}`);
    console.log(`  Время окончания ставок: ${new Date(Number(roundInfo.endTime) * 1000).toLocaleString()}`);
    console.log(`  Время результата: ${new Date(Number(roundInfo.resultTime) * 1000).toLocaleString()}`);
    console.log(`  Количество ставок: ${roundInfo.totalBets.toString()}`);
    
    // Получаем ставки текущего раунда напрямую
    const bets = await contract.getCurrentRoundBets();
    
    if (bets && bets.length > 0) {
      let totalPool = ethers.parseEther("0");
      
      for (let i = 0; i < bets.length; i++) {
        totalPool = totalPool + bets[i].amount;
      }
      
      console.log(`  Общий призовой фонд: ${ethers.formatEther(totalPool)} MATIC`);
    } else {
      console.log(`  Общий призовой фонд: 0 MATIC`);
    }
    
    if (roundInfo.isAIPredictionSet !== undefined) {
      console.log(`  Прогноз AI установлен: ${roundInfo.isAIPredictionSet}`);
    }
  } catch (error) {
    console.error("\n⚠️ Ошибка при получении информации о раунде:", error.message);
    
    // Пробуем получить информацию альтернативным способом
    try {
      const roundNumber = await contract.roundNumber();
      const currentRoundStart = await contract.currentRoundStart();
      const bettingPeriod = await contract.bettingPeriod();
      const resultDelay = await contract.resultDelay();
      
      console.log("\nИнформация о текущем раунде (альтернативный метод):");
      console.log(`  Номер раунда: ${roundNumber.toString()}`);
      console.log(`  Время начала: ${new Date(Number(currentRoundStart) * 1000).toLocaleString()}`);
      console.log(`  Время окончания ставок: ${new Date((Number(currentRoundStart) + Number(bettingPeriod)) * 1000).toLocaleString()}`);
      console.log(`  Время результата: ${new Date((Number(currentRoundStart) + Number(bettingPeriod) + Number(resultDelay)) * 1000).toLocaleString()}`);
      
      // Получаем ставки текущего раунда
      const bets = await contract.getCurrentRoundBets();
      console.log(`  Количество ставок: ${bets.length}`);
      
      if (bets && bets.length > 0) {
        let totalPool = ethers.parseEther("0");
        
        for (let i = 0; i < bets.length; i++) {
          totalPool = totalPool + bets[i].amount;
        }
        
        console.log(`  Общий призовой фонд: ${ethers.formatEther(totalPool)} MATIC`);
      } else {
        console.log(`  Общий призовой фонд: 0 MATIC`);
      }
    } catch (innerError) {
      console.error("\n⚠️ Не удалось получить информацию альтернативным способом:", innerError.message);
    }
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
    
    // Проверяем статус раунда
    console.log("\nСтатус раунда:");
    if (status === "READY_FOR_RESOLUTION") {
      console.log("⚠️  Раунд готов к разрешению. Вы можете вызвать функцию determineWinnersAndStartNewRound()");
    } else if (status === "BETTING_OPEN") {
      console.log("✅ Раунд открыт для ставок");
    } else if (status === "WAITING_FOR_RESULT") {
      console.log("⏳ Раунд в ожидании результата");
    } else if (status === "WAITING_TO_START") {
      console.log("⏳ Раунд ожидает начала");
    }
  } catch (error) {
    console.error("\n⚠️ Ошибка при получении состояния контракта:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 