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
    
    // Проверяем баланс перед размещением ставки
    const balanceWei = await ethers.provider.getBalance(deployer.address);
    const balanceMatic = ethers.formatEther(balanceWei);
    console.log(`Текущий баланс: ${balanceWei} wei (${balanceMatic} MATIC)`);
    
    // Проверяем, достаточно ли средств для ставки
    if (balanceWei < ethers.parseEther("0.2")) {
      console.error("❌ Недостаточно средств для размещения ставки (требуется минимум 0.1 MATIC + газ)");
      console.error("Пожалуйста, пополните кошелек через Polygon Amoy faucet: https://amoy.polygonscan.com/faucet");
      return;
    }
    
    // Подключаемся к контракту
    const BTCBettingPolygon = await ethers.getContractFactory("BTCBettingPolygon");
    const contract = await BTCBettingPolygon.attach(contractAddress);
    
    // Проверяем статус раунда
    const status = await contract.getRoundStatus();
    console.log(`Текущий статус раунда: ${status}`);
    
    if (status !== "BETTING_OPEN") {
      console.log("⚠️ Раунд не открыт для ставок. Невозможно разместить ставку.");
      return;
    }
    
    // Получаем текущую цену BTC
    const btcPrice = await contract.getBTCPrice();
    console.log(`Текущая цена BTC: ${btcPrice.toString()} USD`);
    
    // Размещаем тестовую ставку (прогноз: текущая цена + 100)
    const predictedPrice = parseInt(btcPrice.toString()) + 100;
    console.log(`Размещаем ставку с прогнозом: ${predictedPrice} USD`);
    
    // Сумма ставки: 0.1 MATIC
    const betAmount = ethers.parseEther("0.1");
    console.log(`Сумма ставки: ${ethers.formatEther(betAmount)} MATIC`);
    
    // Размещаем ставку
    console.log("Отправляем транзакцию...");
    const tx = await contract.placeBet(predictedPrice, { value: betAmount });
    console.log(`Транзакция отправлена: ${tx.hash}`);
    console.log("Ожидаем подтверждения...");
    
    await tx.wait();
    console.log("✅ Ставка успешно размещена!");
    
    // Проверяем, что ставка была учтена
    const bets = await contract.getCurrentRoundBets();
    console.log(`Количество ставок в текущем раунде: ${bets.length}`);
    
    // Получаем статистику ставок текущего игрока
    const playerStats = await contract.getPlayerCurrentRoundStats(deployer.address);
    console.log("\nСтатистика ваших ставок:");
    console.log(`  Количество ставок: ${playerStats[0].toString()}`);
    console.log(`  Общая сумма ставок: ${ethers.formatEther(playerStats[1])} MATIC`);
    console.log(`  Прогнозы цен: ${playerStats[2].map(p => p.toString()).join(", ")} USD`);
    
  } catch (error) {
    console.error("Ошибка при размещении ставки:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 