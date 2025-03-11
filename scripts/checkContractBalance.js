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
    
    // Получаем баланс контракта
    const contractBalance = await ethers.provider.getBalance(contractAddress);
    console.log(`Баланс контракта: ${contractBalance} wei (${ethers.formatEther(contractBalance)} MATIC)`);
    
    // Если баланс контракта равен 0, значит все средства были выплачены
    if (contractBalance.toString() === "0") {
      console.log("✅ Все средства были выплачены из контракта.");
    } else {
      console.log("⚠️ В контракте остались средства. Возможно, не все выплаты были произведены.");
    }
    
  } catch (error) {
    console.error("Ошибка при проверке баланса контракта:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 