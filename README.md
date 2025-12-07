# Real-Time Fintech Trading Analytics Dashboard

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

A production-quality web dashboard for real-time price and trade data visualization, optimized for modern trading scenarios.

## 📸 Screenshots & Demo

### Application Screenshots

**Login Screen**
![Login Screen](./screenshots/login.png)
*Secure authentication with demo credentials displayed for easy testing*

**Main Dashboard**
![Trading Dashboard](./screenshots/dashboard.png)
*Real-time trading dashboard featuring live price updates, candlestick charts, symbol search, and watchlist management*

### Demo Video

📹 **[Watch 2-minute demo video](https://github.com/user-attachments/assets/c65711e2-f6c2-4d40-a9f3-79c630b5bc57)**

The demo showcases:
- User authentication flow
- Real-time price updates via WebSocket
- Interactive TradingView candlestick charts
- Custom watchlist creation and management
- Symbol search and navigation

## 🚀 Tech Stack

- **Frontend**: Next.js 15+ (App Router), TypeScript, Tailwind CSS, TanStack Query
- **Backend**: NestJS, TypeScript, WebSockets, REST APIs
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO for WebSocket communication
- **Charts**: Lightweight Charts (TradingView)

## 📁 Project Structure

```
/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Shared TypeScript types/DTOs
└── pnpm-workspace.yaml
```

## ✨ Features

- **Live Order Book & Price Ticker**: Real-time price updates via WebSocket
- **Watchlists**: User-specific watchlists saved server-side
- **Historical Charts**: Candlestick/OHLC charts with volume
- **User Authentication**: JWT-based auth with bcrypt password hashing
- **Responsive Design**: Desktop and mobile-friendly layout

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+

### Installation

1. Clone and install dependencies:

```bash
pnpm install
```

2. Set up the database:

```bash
# Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit apps/api/.env with your PostgreSQL connection string
# DATABASE_URL="postgresql://user:password@localhost:5432/trading_dashboard"

# Generate Prisma client and push schema
pnpm db:generate
pnpm db:push

# Seed the database with sample data
cd apps/api && pnpm db:seed && cd ../..
```

3. Start development servers:

```bash
pnpm dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## 🔑 Demo Credentials

After running the seed script:

- **Email**: demo@example.com
- **Password**: password123

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| GET | `/auth/me` | Get current user (protected) |

### Symbols

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/symbols` | List symbols (pagination, search) |
| GET | `/symbols/:ticker/history` | Historical OHLCV data |

### Watchlists (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/watchlists` | Get user's watchlists |
| POST | `/watchlists` | Create watchlist |
| POST | `/watchlists/:id/items` | Add symbol to watchlist |
| DELETE | `/watchlists/:id/items/:itemId` | Remove symbol |

### WebSocket

- **Namespace**: `/realtime`
- **Events**:
  - `subscribeToSymbols` - Subscribe to price updates
  - `priceUpdate:{ticker}` - Receive price updates

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run API tests only
pnpm test:api

# Run e2e tests
cd apps/api && pnpm test:e2e
```

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all development servers |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:migrate` | Run database migrations |

## 🏗️ Architecture

### Backend Modules

- **AuthModule**: JWT authentication, user registration/login
- **UsersModule**: User management
- **SymbolsModule**: Stock symbols and historical data
- **MarketDataModule**: Real-time price simulation
- **WatchlistModule**: User watchlists
- **WebSocketModule**: Real-time price streaming

### Frontend Structure

- **App Router**: `/login`, `/dashboard`
- **Components**: PriceChart, PriceTicker, WatchlistPanel, SymbolSearch
- **Hooks**: useRealtimePrices (WebSocket)
- **Context**: AuthProvider (authentication state)

## 📄 License

MIT
