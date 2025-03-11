# Смарт-контракт для ставок на цену BTC

Этот проект реализует смарт-контракт для ставок на будущую цену Bitcoin с использованием оракулов Chainlink. Пользователи могут делать ставки на будущую цену Bitcoin, а победители определяются на основе фактической цены, полученной от оракулов Chainlink.

## Архитектура

Проект использует кросс-чейн архитектуру:

- **Деплой контракта**: Контракт развернут в тестовой сети **Polygon Amoy** (с планами миграции на Polygon Mainnet)
- **Источник данных о цене**: Данные о цене BTC/USD получаются из:
  - Chainlink Price Feeds в тестовой сети **Sepolia** (для продакшена)
  - Мок-оракула Chainlink в **Polygon Amoy** (для тестирования)

## Функциональность

- Размещение ставок на будущую цену BTC
- Система предсказаний ИИ для сравнения
- Динамические периоды ставок и задержки результатов
- Автоматическое определение победителей
- Распределение призов на основе точности предсказаний
- Система комиссий владельца (настраиваемый процент)

## Интеграция с Chainlink Price Feeds

Проект использует Chainlink Price Feeds для получения надежных, децентрализованных данных о цене BTC/USD. Интеграция следует лучшим практикам из [документации Chainlink](https://docs.chain.link/data-feeds/using-data-feeds).

### Адреса Price Feed

Контракт использует следующие адреса для получения цены BTC/USD:

#### Тестовые сети

- Sepolia: `0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43`
- Мок-оракул на Polygon Amoy: `0xBb9C1B4F5C5E6B25DFF93ff9Bd6A387c520c05c6`

#### Основные сети

- Ethereum: `0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c`

## Начало работы

### Предварительные требования

- Node.js и npm
- Hardhat

### Установка

```shell
npm install
```

### Деплой контракта

Для деплоя контракта в Polygon Amoy с использованием Hardhat Ignition:

```shell
# Деплой с использованием оракула Sepolia
npx hardhat ignition deploy ./ignition/modules/deploy.js --network polygon_amoy

# Деплой с использованием мок-оракула и динамическими периодами
INITIAL_BETTING_PERIOD=10m INITIAL_RESULT_DELAY=5m npx hardhat ignition deploy ./ignition/modules/deployWithMockDynamic.js --network polygon_amoy
```

### Деплой мок-оракула

Для целей тестирования вы можете развернуть мок-оракул Chainlink:

```shell
npx hardhat run scripts/deployMockPriceFeed.js --network polygon_amoy
```

### Проверка статуса контракта

Для проверки статуса развернутого контракта:

```shell
npx hardhat run scripts/checkDynamicContract.js --network polygon_amoy
```

### Обновление цены в мок-оракуле

Для обновления цены BTC в мок-оракуле:

```shell
NEW_PRICE=92000 npx hardhat run scripts/updateMockPrice.js --network polygon_amoy
```

### Управление периодами ставок

Для обновления периода ставок и задержки результатов:

```shell
# Установка периода ставок в 10 минут
BETTING_PERIOD=10m npx hardhat run scripts/updateTimePeriods.js --network polygon_amoy

# Установка задержки результатов в 5 минут
RESULT_DELAY=5m npx hardhat run scripts/updateTimePeriods.js --network polygon_amoy

# Обновление обоих параметров одновременно
BETTING_PERIOD=10m RESULT_DELAY=5m npx hardhat run scripts/updateTimePeriods.js --network polygon_amoy
```

## Детали реализации

Контракт использует интерфейс AggregatorV3Interface от Chainlink для получения последней цены BTC/USD:

```solidity
// Получение текущей цены BTC из Chainlink
function getBTCPrice() public view returns (uint256) {
    // Получаем данные о цене из Chainlink
    (
        uint80 roundId,
        int256 price,
        ,
        uint256 updatedAt,
        uint80 answeredInRound
    ) = btcPriceFeed.latestRoundData();

    // Проверки безопасности
    require(price > 0, "Invalid price");
    require(updatedAt > 0, "Round not complete");
    require(answeredInRound >= roundId, "Stale price");
    require(block.timestamp - updatedAt <= 1 hours, "Price too old");

    // Конвертация цены из формата Chainlink (8 десятичных знаков) в стандартный формат
    return uint256(price / 1e8);
}
```

### Реализованные лучшие практики

1. **Валидация данных**: Контракт проверяет, что цена положительная, раунд завершен, и данные не устарели.
2. **Проверка свежести**: Гарантирует, что данные о цене не слишком старые (менее 1 часа).
3. **Правильная обработка десятичных знаков**: Конвертирует цену из формата Chainlink (с 8 десятичными знаками) в стандартный формат.
4. **Кросс-чейн архитектура**: Деплой на Polygon Amoy, но использование данных о цене из Sepolia.
5. **Динамические периоды**: Возможность настройки периодов ставок и задержек результатов для упрощения тестирования.

## Автоматизация определения победителей

В проекте реализованы скрипты для автоматического определения победителей и запуска новых раундов:

1. **scripts/determineWinners.js** - Скрипт для проверки состояния раунда и вызова функции определения победителей, если наступило подходящее время.

2. **scripts/setupCron.js** - Скрипт для настройки cron-задачи, которая будет автоматически запускать скрипт определения победителей в заданное время каждый день.

### Настройка автоматизации

1. Сначала убедитесь, что в файле `.env` указаны необходимые переменные:

   ```
   PRIVATE_KEY=ваш_приватный_ключ
   CONTRACT_ADDRESS=адрес_вашего_контракта
   CRON_TIME=5 21 * * *  # По умолчанию 21:05 UTC
   MOCK_PRICE_FEED_ADDRESS=адрес_мок_оракула  # Для тестирования
   ```

2. Запустите скрипт настройки cron-задачи:

   ```
   node scripts/setupCron.js
   ```

3. Проверьте, что cron-задача успешно настроена:
   ```
   crontab -l
   ```

### Ручной запуск скрипта определения победителей

Вы также можете запустить скрипт определения победителей вручную:

```
npx hardhat run scripts/determineWinners.js --network polygon_amoy
```

Скрипт проверит текущее состояние раунда и вызовет функцию определения победителей только если наступило подходящее время.

## Дополнительная документация

Подробная информация о динамических периодах и тестировании доступна в файле [CONTRACT_INFO.md](./CONTRACT_INFO.md).

## Лицензия

Этот проект лицензирован под лицензией MIT.
