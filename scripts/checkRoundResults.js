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
    
    // Получаем текущий номер раунда
    const currentRoundNumber = await contract.roundNumber();
    console.log(`Текущий номер раунда: ${currentRoundNumber.toString()}`);
    
    // Получаем фильтр для событий RoundResolved
    const filter = contract.filters.RoundResolved();
    
    // Получаем события
    const events = await contract.queryFilter(filter);
    console.log(`Найдено ${events.length} событий RoundResolved:`);
    
    // Выводим информацию о каждом событии
    for (const event of events) {
      const roundNumber = event.args[0].toString();
      const actualPrice = event.args[1].toString();
      const winners = event.args[2];
      const winningAmounts = event.args[3].map(amount => ethers.formatEther(amount));
      const totalPrizePool = ethers.formatEther(event.args[4]);
      
      console.log(`\nРаунд #${roundNumber}:`);
      console.log(`  Фактическая цена BTC: ${actualPrice} USD`);
      console.log(`  Общий призовой фонд: ${totalPrizePool} MATIC`);
      
      if (winners.length > 0) {
        console.log(`  Победители (${winners.length}):`);
        for (let i = 0; i < winners.length; i++) {
          console.log(`    ${i+1}. ${winners[i]} - ${winningAmounts[i]} MATIC`);
        }
      } else {
        console.log(`  Победителей нет. AI выиграл!`);
      }
    }
    
    // Если нет событий RoundResolved
    if (events.length === 0) {
      console.log("Не найдено событий RoundResolved. Возможно, ни один раунд еще не был разрешен.");
    }
    
  } catch (error) {
    console.error("Ошибка при проверке результатов раунда:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 