# Подробная информация о контракте BTCBettingPolygon

## Динамические периоды для тестирования

Контракт `BTCBettingPolygon` поддерживает динамические периоды ставок и задержки результатов, что значительно упрощает тестирование и разработку. Эта функциональность позволяет владельцу контракта изменять временные параметры без необходимости повторного деплоя.

### Контракты и адреса

1. **Контракт BTCBettingPolygon с динамическими периодами**: `0xf1F6537D505e6614dBB14E681E160796F90D6fe8`
2. **Мок-оракул Chainlink для BTC/USD**: `0xBb9C1B4F5C5E6B25DFF93ff9Bd6A387c520c05c6`

### Управление периодами

Для изменения периодов используйте следующие скрипты:

```bash
# Установка периода ставок в 10 минут
PERIOD=10m npx hardhat run scripts/setBettingPeriod.js --network polygon_amoy

# Установка задержки результатов в 5 минут
DELAY=5m npx hardhat run scripts/setResultDelay.js --network polygon_amoy
```

Поддерживаемые форматы времени:

- Минуты: `10m`, `30m`
- Часы: `1h`, `2h`
- Дни: `1d`

### Проверка состояния контракта

Для проверки текущего состояния контракта используйте следующие скрипты:

```bash
# Проверка статуса текущего раунда
npx hardhat run scripts/checkRoundStatus.js --network polygon_amoy

# Проверка результатов раунда
npx hardhat run scripts/checkRoundResults.js --network polygon_amoy

# Проверка баланса контракта
npx hardhat run scripts/checkContractBalance.js --network polygon_amoy
```

Эти скрипты выведут информацию о:

- Текущих периодах ставок и задержки результатов
- Текущей цене BTC
- Информации о текущем раунде (номер, время начала/окончания, призовой фонд)
- Статусе раунда

### Обновление цены BTC в мок-оракуле

Для обновления цены BTC в мок-оракуле используйте:

```bash
NEW_PRICE=92000 npx hardhat run scripts/updateMockPrice.js --network polygon_amoy
```

### Деплой контракта с динамическими периодами

Для деплоя нового контракта с заданными начальными периодами используйте:

```bash
INITIAL_BETTING_PERIOD=10m INITIAL_RESULT_DELAY=5m npx hardhat ignition deploy ./ignition/modules/deployWithMockDynamic.js --network polygon_amoy
```

### Дополнительные команды для тестирования

```bash
# Запуск нового раунда
npx hardhat run scripts/startRoundNow.js --network polygon_amoy

# Размещение тестовой ставки
npx hardhat run scripts/placeBetTest.js --network polygon_amoy

# Установка предсказания AI
npx hardhat run scripts/setAIPredictionTest.js --network polygon_amoy

# Разрешение раунда (тест)
npx hardhat run scripts/resolveRoundTest.js --network polygon_amoy

# Сброс раунда
npx hardhat run scripts/resetRound.js --network polygon_amoy
```

## License

This project is licensed under the MIT License.
