import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Hong Kong stock symbols for realistic simulation
const hkSymbols = [
  { ticker: '0005.HK', name: 'HSBC Holdings', market: 'HKEX' },
  { ticker: '0700.HK', name: 'Tencent Holdings', market: 'HKEX' },
  { ticker: '9988.HK', name: 'Alibaba Group', market: 'HKEX' },
  { ticker: '1299.HK', name: 'AIA Group', market: 'HKEX' },
  { ticker: '0941.HK', name: 'China Mobile', market: 'HKEX' },
  { ticker: '0388.HK', name: 'Hong Kong Exchanges', market: 'HKEX' },
  { ticker: '2318.HK', name: 'Ping An Insurance', market: 'HKEX' },
  { ticker: '0883.HK', name: 'CNOOC', market: 'HKEX' },
  { ticker: '1398.HK', name: 'ICBC', market: 'HKEX' },
  { ticker: '3988.HK', name: 'Bank of China', market: 'HKEX' },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      passwordHash,
    },
  });
  console.log(`✅ Created test user: ${user.email}`);

  // Create symbols
  for (const symbolData of hkSymbols) {
    const symbol = await prisma.symbol.upsert({
      where: { ticker: symbolData.ticker },
      update: {},
      create: symbolData,
    });
    
    // Generate some historical data (last 100 ticks)
    const existingTicks = await prisma.priceTick.count({
      where: { symbolId: symbol.id },
    });

    if (existingTicks === 0) {
      let lastPrice = Math.random() * 200 + 10;
      const ticks = [];
      const now = Date.now();

      for (let i = 100; i >= 0; i--) {
        const volatility = 0.01;
        const change = lastPrice * volatility * (Math.random() - 0.5);
        const open = lastPrice;
        const close = Math.max(0.01, lastPrice + change);
        const high = Math.max(open, close) * (1 + Math.random() * 0.003);
        const low = Math.min(open, close) * (1 - Math.random() * 0.003);
        const volume = Math.floor(Math.random() * 99000) + 1000;

        ticks.push({
          symbolId: symbol.id,
          timestamp: new Date(now - i * 60000), // 1 minute intervals
          open: Math.round(open * 100) / 100,
          high: Math.round(high * 100) / 100,
          low: Math.round(low * 100) / 100,
          close: Math.round(close * 100) / 100,
          volume,
        });

        lastPrice = close;
      }

      await prisma.priceTick.createMany({ data: ticks });
      console.log(`✅ Created symbol: ${symbol.ticker} with ${ticks.length} price ticks`);
    } else {
      console.log(`✅ Symbol already exists: ${symbol.ticker}`);
    }
  }

  // Create a default watchlist for the test user
  const watchlist = await prisma.watchlist.upsert({
    where: { 
      id: 'default-watchlist',
    },
    update: {},
    create: {
      id: 'default-watchlist',
      userId: user.id,
      name: 'My Watchlist',
    },
  });

  // Add some symbols to the watchlist
  const watchlistSymbols = ['0005.HK', '0700.HK', '9988.HK'];
  for (const symbol of watchlistSymbols) {
    await prisma.watchlistItem.upsert({
      where: {
        watchlistId_symbol: {
          watchlistId: watchlist.id,
          symbol,
        },
      },
      update: {},
      create: {
        watchlistId: watchlist.id,
        symbol,
      },
    });
  }
  console.log(`✅ Created watchlist with ${watchlistSymbols.length} items`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
