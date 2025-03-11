# BTC Betting App - Контекст обсуждения

## Обзор проекта

Разработка фулстек-приложения для взаимодействия со смарт-контрактом BTCBettingPolygon, который позволяет пользователям делать ставки на будущую цену Bitcoin.

## Технологический стек

- **Фронтенд**: Next.js с App Router
- **CMS**: Payload CMS
- **Блокчейн-интеграция**: ethers.js
- **Аутентификация**: Metamask и WalletConnect (возможно Clerk.js)
- **AI-интеграция**: OpenAI или Grok для анализа и предсказаний

## Архитектура приложения

### Фронтенд (Next.js)

- App Router для маршрутизации
- Server Components для основного контента
- Client Components для интерактивных элементов (подключение кошелька, размещение ставок)
- Интеграция с ethers.js для взаимодействия с контрактом
- Поддержка Metamask и WalletConnect через Web3Modal или ConnectKit

### Бэкенд (Payload CMS)

- Управление контентом (новости, FAQ, документация)
- Хранение метаданных о раундах и ставках
- API для интеграции с OpenAI/Grok
- Аналитика и статистика

### Интеграция с AI

- Модуль для анализа исторических данных о цене BTC
- Генерация предсказаний с использованием OpenAI или Grok
- Автоматическое размещение ставок от имени AI

## Структура проекта

```
btc-betting-app/
├── app/                      # Next.js App Router
│   ├── api/                  # API маршруты
│   ├── dashboard/            # Личный кабинет пользователя
│   ├── admin/                # Административная панель
│   ├── rounds/               # Информация о раундах
│   ├── ai-predictions/       # AI предсказания
│   └── layout.tsx            # Основной макет
├── components/               # React компоненты
│   ├── ui/                   # UI компоненты
│   ├── blockchain/           # Компоненты для работы с блокчейном
│   ├── rounds/               # Компоненты для отображения раундов
│   └── wallet/               # Компоненты для работы с кошельком
├── lib/                      # Утилиты и хелперы
│   ├── blockchain/           # Утилиты для работы с блокчейном
│   ├── ai/                   # Интеграция с OpenAI/Grok
│   └── utils/                # Общие утилиты
├── payload/                  # Конфигурация Payload CMS
│   ├── collections/          # Коллекции данных
│   ├── globals/              # Глобальные настройки
│   └── payload.config.ts     # Конфигурация Payload
├── public/                   # Статические файлы
└── styles/                   # Глобальные стили
```

## Основные страницы и функциональность

### Главная страница

- Текущая цена BTC
- Информация о текущем раунде (статус, время до окончания)
- Кнопка для размещения ставки
- Статистика предыдущих раундов
- Предсказания AI

### Страница раунда

- Детальная информация о раунде
- Форма для размещения ставки
- Таймер до окончания периода ставок/определения результатов
- Список ставок (анонимизированный)
- Предсказание AI для этого раунда

### Личный кабинет

- История ставок пользователя
- Статистика выигрышей/проигрышей
- Настройки уведомлений
- Возможность подписаться на AI-ставки

### Административная панель

- Управление параметрами контракта (для владельца)
- Мониторинг активности
- Управление мок-оракулом (для тестирования)
- Статистика и аналитика

## Примеры кода

### Подключение к контракту

```typescript
import { ethers } from "ethers";
import BTCBettingABI from "@/lib/blockchain/abis/BTCBettingPolygon.json";

export async function getContract(provider) {
  const signer = provider.getSigner();
  const contract = new ethers.Contract(
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    BTCBettingABI,
    signer
  );
  return contract;
}
```

### Компонент для подключения кошелька

```typescript
"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function WalletConnect() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        setProvider(provider);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  return (
    <div>
      {account ? (
        <div>
          Connected: {account.substring(0, 6)}...{account.substring(38)}
        </div>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  );
}
```

### Интеграция с AI (OpenAI/Grok)

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateBTCPrediction() {
  // Получение исторических данных о цене BTC
  const historicalData = await fetchHistoricalBTCData();

  // Формирование запроса к OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a cryptocurrency price prediction expert. Analyze the historical BTC price data and provide a prediction for the next 24 hours.",
      },
      {
        role: "user",
        content: `Here is the historical BTC price data for the last 7 days: ${JSON.stringify(
          historicalData
        )}. Predict if the price will go UP or DOWN in the next 24 hours and provide a confidence score between 0 and 1.`,
      },
    ],
    temperature: 0.7,
  });

  // Парсинг ответа
  const prediction = parsePredictionResponse(
    response.choices[0].message.content
  );

  return prediction;
}

function parsePredictionResponse(content) {
  // Логика для извлечения предсказания и уровня уверенности из ответа
  // ...
  return {
    direction: "UP", // или "DOWN"
    confidence: 0.75,
    reasoning: "Анализ показывает положительную динамику...",
  };
}
```

### Payload CMS интеграция

```typescript
// payload.config.ts
import { buildConfig } from "payload/config";
import path from "path";

import Users from "./collections/Users";
import Rounds from "./collections/Rounds";
import Predictions from "./collections/Predictions";
import AISettings from "./globals/AISettings";

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  admin: {
    user: Users.slug,
  },
  collections: [
    Users,
    Rounds,
    Predictions,
    // другие коллекции
  ],
  globals: [
    AISettings,
    // другие глобальные настройки
  ],
  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, "generated-schema.graphql"),
  },
});
```

### Коллекция для раундов

```typescript
// collections/Rounds.ts
import { CollectionConfig } from "payload/types";

const Rounds: CollectionConfig = {
  slug: "rounds",
  admin: {
    useAsTitle: "roundNumber",
  },
  fields: [
    {
      name: "roundNumber",
      type: "number",
      required: true,
    },
    {
      name: "startTime",
      type: "date",
      required: true,
    },
    {
      name: "bettingEndTime",
      type: "date",
      required: true,
    },
    {
      name: "resultTime",
      type: "date",
      required: true,
    },
    {
      name: "startPrice",
      type: "number",
    },
    {
      name: "endPrice",
      type: "number",
    },
    {
      name: "status",
      type: "select",
      options: [
        { label: "Waiting to Start", value: "waiting_to_start" },
        { label: "Betting Open", value: "betting_open" },
        { label: "Betting Closed", value: "betting_closed" },
        { label: "Results Ready", value: "results_ready" },
      ],
      required: true,
    },
    {
      name: "totalBets",
      type: "number",
      defaultValue: 0,
    },
    {
      name: "aiPrediction",
      type: "relationship",
      relationTo: "predictions",
    },
  ],
};

export default Rounds;
```

## Интеграция Payload CMS с Next.js App Router

```typescript
// server.js
const express = require("express");
const next = require("next");
const payload = require("payload");
const { resolve } = require("path");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const server = express();

  // Инициализация Payload CMS
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    mongoURL: process.env.MONGODB_URI,
    express: server,
    onInit: () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`);
    },
  });

  // Обработка всех остальных запросов через Next.js
  server.all("*", (req, res) => {
    return handle(req, res);
  });

  // Запуск сервера
  server.listen(3000, (err) => {
    if (err) throw err;
    console.log("> Ready on http://localhost:3000");
  });
});
```

## Примерная структура .env файла

```
# Next.js
NEXT_PUBLIC_URL=http://localhost:3000

# Blockchain
NEXT_PUBLIC_CONTRACT_ADDRESS=0xDdb8C35Bc93c01ca08522081B04cD8Ed6e10e07C
NEXT_PUBLIC_CHAIN_ID=80001
NEXT_PUBLIC_NETWORK_NAME=Polygon Amoy

# Payload CMS
PAYLOAD_SECRET=your-payload-secret
MONGODB_URI=mongodb://localhost:27017/btc-betting
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

# AI Integration
OPENAI_API_KEY=your-openai-api-key

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

## Полезные команды для сетапа

```bash
# Создание Next.js проекта с TypeScript и App Router
npx create-next-app@latest btc-betting-app --typescript --eslint --app --tailwind

# Установка Payload CMS
cd btc-betting-app
npm install payload

# Инициализация Payload CMS
npx payload init

# Установка ethers.js
npm install ethers@5.7.2

# Установка Web3Modal для подключения кошельков
npm install @web3modal/ethereum @web3modal/react wagmi

# Установка OpenAI SDK
npm install openai
```

## Следующие шаги

1. **Настройка проекта:**

   - Инициализация Next.js с Typescript
   - Настройка Payload CMS
   - Настройка базы данных (MongoDB для Payload)

2. **Разработка базовых компонентов:**

   - Компоненты для подключения кошелька
   - Компоненты для отображения информации о раундах
   - Формы для размещения ставок

3. **Интеграция с блокчейном:**

   - Настройка подключения к контракту
   - Реализация функций для чтения данных и отправки транзакций

4. **Разработка AI-модуля:**

   - Интеграция с OpenAI/Grok API
   - Разработка алгоритма анализа и предсказания

5. **Разработка административных функций:**
   - Управление параметрами контракта
   - Мониторинг активности
