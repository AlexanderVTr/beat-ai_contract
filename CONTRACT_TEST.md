# Тестирование смарт-контракта BTCBettingPolygon

В этом документе описаны шаги для тестирования основных функций смарт-контракта BTCBettingPolygon.

## Подготовка

### Проверка баланса кошелька

```bash
npx hardhat run --network polygon_amoy scripts/checkBalance.js
```

Убедитесь, что на кошельке достаточно средств для размещения ставок (минимум 0.1 MATIC + газ).

### Проверка статуса раунда

```bash
npx hardhat run --network polygon_amoy scripts/checkRoundStatus.js
```

## Деплой контракта

### Компиляция контракта

```bash
npx hardhat compile
```

### Деплой контракта

```bash
INITIAL_BETTING_PERIOD=10m INITIAL_RESULT_DELAY=5m npx hardhat ignition deploy ./ignition/modules/deployWithMockDynamicV2.js --network polygon_amoy
```

После деплоя сохраните адрес контракта в файле `.env`:

```
CONTRACT_ADDRESS=0x21Ae2f58D2BBE92094E36F7D0f67eeDF8b032F89
```

## Обновление цены в мок-оракуле

```bash
NEW_PRICE=90000 npx hardhat run --network polygon_amoy scripts/updateMockPrice.js
```

## Сценарий 1: AI выигрывает

### Размещение ставки

```bash
npx hardhat run --network polygon_amoy scripts/placeBetTest.js
```

Скрипт размещает ставку с прогнозом "текущая цена + 100" (например, 90100 USD).

### Установка AI-предсказания

```bash
npx hardhat run --network polygon_amoy scripts/setAIPredictionTest.js
```

Скрипт устанавливает AI-предсказание с прогнозом "текущая цена - 50" (например, 89950 USD).

### Ожидание окончания раунда

Дождитесь, когда раунд перейдет в статус "READY_FOR_RESOLUTION":

```bash
npx hardhat run --network polygon_amoy scripts/checkRoundStatus.js
```

### Определение победителей

```bash
npx hardhat run --network polygon_amoy scripts/resolveRoundTest.js
```

### Проверка результатов

```bash
npx hardhat run --network polygon_amoy scripts/checkRoundResults.js
```

### Проверка баланса контракта

```bash
npx hardhat run --network polygon_amoy scripts/checkContractBalance.js
```

## Сценарий 2: Пользователь выигрывает

### Обновление цены в мок-оракуле

```bash
NEW_PRICE=91000 npx hardhat run --network polygon_amoy scripts/updateMockPrice.js
```

### Размещение ставки

```bash
npx hardhat run --network polygon_amoy scripts/placeBetTest.js
```

Скрипт размещает ставку с прогнозом "текущая цена + 100" (например, 91100 USD).

### Изменение AI-предсказания

Отредактируйте скрипт `setAIPredictionTest.js`, чтобы AI-предсказание было дальше от фактической цены:

```javascript
// Устанавливаем прогноз AI (прогноз: текущая цена + 200)
const aiPrediction = parseInt(btcPrice.toString()) + 200;
```

### Установка AI-предсказания

```bash
npx hardhat run --network polygon_amoy scripts/setAIPredictionTest.js
```

### Обновление цены перед окончанием раунда

```bash
NEW_PRICE=91050 npx hardhat run --network polygon_amoy scripts/updateMockPrice.js
```

### Ожидание окончания раунда

Дождитесь, когда раунд перейдет в статус "READY_FOR_RESOLUTION":

```bash
npx hardhat run --network polygon_amoy scripts/checkRoundStatus.js
```

### Определение победителей

```bash
npx hardhat run --network polygon_amoy scripts/resolveRoundTest.js
```

### Проверка результатов

```bash
npx hardhat run --network polygon_amoy scripts/checkRoundResults.js
```

## Дополнительные команды

### Сброс текущего раунда

```bash
npx hardhat run --network polygon_amoy scripts/resetRound.js
```

### Немедленный запуск раунда

```bash
npx hardhat run --network polygon_amoy scripts/startRoundNow.js
```

## Модификация контракта

### Изменение минимальной суммы ставки

1. Измените значение в функции `placeBet`:

   ```solidity
   require(msg.value >= 0.1 ether, "Minimum bet is 0.1 MATIC");
   ```

2. Измените значение в функции `calculatePotentialWinnings`:

   ```solidity
   require(betAmount >= 0.1 ether, "Minimum bet is 0.1 MATIC");
   ```

3. Скомпилируйте и задеплойте контракт заново.

### Изменение времени начала раунда

Модифицируйте функцию `resetCurrentRound` для немедленного начала раунда:

```solidity
// Устанавливаем новое время начала раунда на текущее время (без задержки)
currentRoundStart = block.timestamp;
```
