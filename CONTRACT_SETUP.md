# Настройка и деплой контракта BTCBettingPolygon

Этот документ содержит подробные инструкции по настройке, деплою и управлению контрактом BTCBettingPolygon и мок-оракулом Chainlink.

## Подготовка окружения

### Настройка .env файла

Создайте файл `.env` в корневой директории проекта со следующими переменными:

```
# Приватный ключ аккаунта для деплоя и управления контрактами
PRIVATE_KEY=ваш_приватный_ключ

# Адрес оракула Chainlink для BTC/USD
# Sepolia
PRICE_FEED_ADDRESS=0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43

# Адрес мок-оракула (заполняется после деплоя)
MOCK_PRICE_FEED_ADDRESS=

# Адрес контракта BTCBettingPolygon (заполняется после деплоя)
CONTRACT_ADDRESS=

# Настройки для cron-задачи определения победителей
CRON_TIME=5 21 * * *  # По умолчанию 21:05 UTC
```

### Установка зависимостей

```shell
npm install
```

## Деплой мок-оракула

### 1. Деплой мок-оракула

```shell
npx hardhat run scripts/deployMockPriceFeed.js --network polygon_amoy
```

После успешного деплоя вы увидите сообщение с адресом мок-оракула:

```
Mock Price Feed deployed to: 0xBb9C1B4F5C5E6B25DFF93ff9Bd6A387c520c05c6
```

### 2. Обновление .env файла

Добавьте адрес мок-оракула в файл `.env`:

```
MOCK_PRICE_FEED_ADDRESS=0xBb9C1B4F5C5E6B25DFF93ff9Bd6A387c520c05c6
```

### 3. Установка начальной цены BTC

```shell
NEW_PRICE=92000 npx hardhat run scripts/updateMockPrice.js --network polygon_amoy
```

## Деплой контракта BTCBettingPolygon

### Вариант 1: Деплой с использованием оракула Sepolia

```shell
npx hardhat ignition deploy ./ignition/modules/deploy.js --network polygon_amoy
```

### Вариант 2: Деплой с использованием мок-оракула

```shell
npx hardhat ignition deploy ./ignition/modules/deployWithMock.js --network polygon_amoy
```

### Вариант 3: Деплой с использованием мок-оракула и динамическими периодами

```shell
INITIAL_BETTING_PERIOD=10m INITIAL_RESULT_DELAY=5m npx hardhat ignition deploy ./ignition/modules/deployWithMockDynamic.js --network polygon_amoy
```

После успешного деплоя вы увидите сообщение с адресом контракта. Добавьте этот адрес в файл `.env`:

```
CONTRACT_ADDRESS=0xDdb8C35Bc93c01ca08522081B04cD8Ed6e10e07C
```

## Верификация контракта

```shell
npx hardhat verify --network polygon_amoy 0xDdb8C35Bc93c01ca08522081B04cD8Ed6e10e07C "0xBb9C1B4F5C5E6B25DFF93ff9Bd6A387c520c05c6"
```

## Управление контрактом

### Проверка статуса контракта

```shell
npx hardhat run scripts/checkDynamicContract.js --network polygon_amoy
```

Пример вывода:

```
Connected to contract at: 0xDdb8C35Bc93c01ca08522081B04cD8Ed6e10e07C
Current BTC price: $92,000.00
Current round: 1
Round status: WAITING_TO_START
Round start time: 2023-07-15 12:00:00 UTC
Betting end time: 2023-07-15 12:10:00 UTC
Result time: 2023-07-15 12:15:00 UTC
Current betting period: 10 minutes
Current result delay: 5 minutes
```

### Управление периодами ставок

#### Изменение периода ставок

```shell
BETTING_PERIOD=15m npx hardhat run scripts/updateTimePeriods.js --network polygon_amoy
```

#### Изменение задержки результатов

```shell
RESULT_DELAY=3m npx hardhat run scripts/updateTimePeriods.js --network polygon_amoy
```

#### Изменение обоих параметров одновременно

```shell
BETTING_PERIOD=15m RESULT_DELAY=3m npx hardhat run scripts/updateTimePeriods.js --network polygon_amoy
```

### Управление ценой BTC в мок-оракуле

```shell
NEW_PRICE=95000 npx hardhat run scripts/updateMockPrice.js --network polygon_amoy
```

## Размещение тестовых ставок

### Размещение ставки на рост цены

```shell
AMOUNT=0.01 DIRECTION=UP npx hardhat run scripts/placeBet.js --network polygon_amoy
```

### Размещение ставки на падение цены

```shell
AMOUNT=0.01 DIRECTION=DOWN npx hardhat run scripts/placeBet.js --network polygon_amoy
```

## Настройка автоматизации определения победителей

### Настройка cron-задачи

```shell
node scripts/setupCron.js
```

### Проверка настроенной cron-задачи

```shell
crontab -l
```

### Ручной запуск определения победителей

```shell
npx hardhat run scripts/determineWinners.js --network polygon_amoy
```

## Полный тестовый сценарий

1. **Деплой мок-оракула**:

   ```shell
   npx hardhat run scripts/deployMockPriceFeed.js --network polygon_amoy
   ```

2. **Установка начальной цены BTC**:

   ```shell
   NEW_PRICE=92000 npx hardhat run scripts/updateMockPrice.js --network polygon_amoy
   ```

3. **Деплой контракта с короткими периодами**:

   ```shell
   INITIAL_BETTING_PERIOD=10m INITIAL_RESULT_DELAY=5m npx hardhat ignition deploy ./ignition/modules/deployWithMockDynamic.js --network polygon_amoy
   ```

4. **Проверка статуса контракта**:

   ```shell
   npx hardhat run scripts/checkDynamicContract.js --network polygon_amoy
   ```

5. **Размещение ставок**:

   ```shell
   AMOUNT=0.01 DIRECTION=UP npx hardhat run scripts/placeBet.js --network polygon_amoy
   AMOUNT=0.01 DIRECTION=DOWN npx hardhat run scripts/placeBet.js --network polygon_amoy
   ```

6. **Ожидание окончания периода ставок**

7. **Обновление цены BTC**:

   ```shell
   NEW_PRICE=95000 npx hardhat run scripts/updateMockPrice.js --network polygon_amoy
   ```

8. **Ожидание времени определения результатов**

9. **Определение победителей**:

   ```shell
   npx hardhat run scripts/determineWinners.js --network polygon_amoy
   ```

10. **Проверка результатов**:
    ```shell
    npx hardhat run scripts/checkWinners.js --network polygon_amoy
    ```

## Устранение неполадок

### Проблема: Транзакция отклонена с ошибкой "Round not active"

**Решение**: Убедитесь, что раунд находится в правильном статусе для выполнения операции. Используйте `checkDynamicContract.js` для проверки текущего статуса.

### Проблема: Ошибка "Price too old"

**Решение**: Обновите цену в мок-оракуле:

```shell
NEW_PRICE=92000 npx hardhat run scripts/updateMockPrice.js --network polygon_amoy
```

### Проблема: Ошибка "Cannot update periods during active round"

**Решение**: Дождитесь окончания текущего раунда или запустите новый деплой контракта с нужными периодами.

### Проблема: Недостаточно средств для транзакции

**Решение**: Пополните баланс аккаунта, указанного в PRIVATE_KEY, токенами MATIC в тестовой сети Polygon Amoy. Вы можете получить тестовые токены через [Polygon Faucet](https://faucet.polygon.technology/).
