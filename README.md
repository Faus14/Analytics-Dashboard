# Qubic Token Analytics Dashboard

Professional, real-time dashboard for Qubic blockchain analytics using live RPC data.

## Features

### 🟢 Live Data from Qubic RPC

- **Network Statistics Card** - Real-time network metrics
  - Circulating Supply
  - Active Addresses
  - Price (USD)
  - Market Cap
  - Uses: `GET /v1/status`

- **Recent Transactions Table** - Last 10 transactions from recent ticks
  - Live transaction details
  - Large transaction alerts (⚠️)
  - Transaction tracking by tick
  - Uses: `GET /v2/ticks/{tick}/transactions`

- **Whale Activity Chart** - Top wallets by transaction volume
  - Buy/Sell analysis from last 10 ticks
  - Manual refresh control
  - Uses: `GET /v2/ticks/{tick}/transactions`

- **Whale Alerts Feed** - Risk events and large movements
  - Transaction alerts > 1000 QU
  - New wallet tracking
  - Uses: `GET /v2/ticks/{tick}/transactions`

- **Blockchain Integrity Monitor** - Chain health verification
  - Current tick tracking
  - Chain hash verification
  - Store hash integrity
  - Quorum status
  - Uses: `GET /v1/chain-hash/{tick}`, `GET /v1/store-hash/{tick}`, `GET /v1/quorum-tick/{tick}`

- **Token Overview** - Core network information
  - Current tick and epoch
  - Demo identity balance
  - RPC connection status
  - Uses: `GET /v1/tick-info`, `GET /v1/balances/{id}`

### 🟡 Mock Data Section (Backend Required)

- Holders Growth Chart
- Token Distribution Chart
- Token Flow Heatmap

## Running the code

```bash
npm i          # Install dependencies
npm run dev    # Start development server
npm run build  # Build for production
```

## Qubic RPC Endpoints Used

| Component | Endpoint | Method |
|-----------|----------|--------|
| Network Stats | `/v1/status` | GET |
| Token Overview | `/v1/tick-info` | GET |
| Token Overview | `/v1/balances/{id}` | GET |
| Recent Transactions | `/v2/ticks/{tick}/transactions` | GET |
| Whale Activity | `/v2/ticks/{tick}/transactions` | GET |
| Whale Alerts | `/v2/ticks/{tick}/transactions` | GET |
| Chain Health | `/v1/chain-hash/{tick}` | GET |
| Chain Health | `/v1/store-hash/{tick}` | GET |
| Chain Health | `/v1/quorum-tick/{tick}` | GET |

## Technology Stack

- React 18
- TypeScript
- Tailwind CSS
- Recharts (data visualization)
- Radix UI (components)
- Lucide React (icons)
- Vite (build tool)
