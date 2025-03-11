require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  // Получаем аккаунт из Hardhat
  const [deployer] = await ethers.getSigners();
  
  console.log(`Проверка баланса для аккаунта: ${deployer.address}`);
  
  // Получаем баланс в wei
  const balanceWei = await ethers.provider.getBalance(deployer.address);
  
  // Конвертируем в MATIC (ethers)
  const balanceMatic = ethers.formatEther(balanceWei);
  
  console.log(`Баланс: ${balanceWei} wei (${balanceMatic} MATIC)`);
  
  // Проверяем, достаточно ли средств для ставки
  if (balanceWei < ethers.parseEther("0.2")) {
    console.log("ВНИМАНИЕ: Недостаточно средств для размещения ставки (требуется минимум 0.1 MATIC + газ)");
    console.log("Пожалуйста, пополните кошелек через Polygon Amoy faucet: https://amoy.polygonscan.com/faucet");
  } else {
    console.log("Баланс достаточен для размещения ставки");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 