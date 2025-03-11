# Подробная информация о контракте BTCBettingPolygon

## Динамические периоды для тестирования

Контракт `BTCBettingPolygon` поддерживает динамические периоды ставок и задержки результатов, что значительно упрощает тестирование и разработку. Эта функциональность позволяет владельцу контракта изменять временные параметры без необходимости повторного деплоя.

### Контракты и адреса

1. **Контракт BTCBettingPolygon с динамическими периодами**: `0xf1F6537D505e6614dBB14E681E160796F90D6fe8`
2. **Мок-оракул Chainlink для BTC/USD**: `0xBb9C1B4F5C5E6B25DFF93ff9Bd6A387c520c05c6`

### Управление периодами

Для изменения периодов используйте скрипт `updateTimePeriods.js`:

```bash
# Установка периода ставок в 10 минут
BETTING_PERIOD=10m npx hardhat run scripts/updateTimePeriods.js --network polygon_amoy

# Установка задержки результатов в 5 минут
RESULT_DELAY=5m npx hardhat run scripts/updateTimePeriods.js --network polygon_amoy

# Установка обоих периодов одновременно
BETTING_PERIOD=10m RESULT_DELAY=5m npx hardhat run scripts/updateTimePeriods.js --network polygon_amoy
```

Поддерживаемые форматы времени:

- Минуты: `10m`, `30m`
- Часы: `1h`, `2h`
- Дни: `1d`

### Проверка состояния контракта

Для проверки текущего состояния контракта используйте скрипт `checkDynamicContract.js`:

```bash
npx hardhat run scripts/checkDynamicContract.js --network polygon_amoy
```

Скрипт выведет информацию о:

- Текущих периодах ставок и задержки результатов
- Текущей цене BTC
- Информации о текущем раунде (номер, время начала/окончания, призовой фонд)
- Статусе раунда

### Обновление цены BTC в мок-оракуле

Для обновления цены BTC в мок-оракуле используйте скрипт `updateMockPrice.js`:

```bash
NEW_PRICE=92000 npx hardhat run scripts/updateMockPrice.js --network polygon_amoy
```

### Деплой контракта с динамическими периодами

Для деплоя нового контракта с заданными начальными периодами используйте:

```bash
INITIAL_BETTING_PERIOD=10m INITIAL_RESULT_DELAY=5m npx hardhat ignition deploy ./ignition/modules/deployWithMockDynamic.js --network polygon_amoy
```

## License

This project is licensed under the MIT License.
