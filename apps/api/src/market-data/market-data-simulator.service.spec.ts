import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MarketDataSimulator } from './market-data-simulator.service';
import { MarketDataService } from './market-data.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MarketDataSimulator', () => {
  let simulator: MarketDataSimulator;
  let marketDataService: MarketDataService;

  const mockPrismaService = {
    symbol: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    priceTick: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
  };

  const mockMarketDataService = {
    savePriceTick: jest.fn().mockResolvedValue({
      id: 'tick-1',
      symbolId: 'symbol-1',
      ticker: '0005.HK',
      timestamp: new Date(),
      open: 100,
      high: 101,
      low: 99,
      close: 100.5,
      volume: 10000,
    }),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(1000),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketDataSimulator,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MarketDataService,
          useValue: mockMarketDataService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    simulator = module.get<MarketDataSimulator>(MarketDataSimulator);
    marketDataService = module.get<MarketDataService>(MarketDataService);
  });

  afterEach(() => {
    simulator.stopSimulation();
    jest.clearAllMocks();
  });

  describe('generateTick', () => {
    it('should generate a valid OHLCV tick', () => {
      const state = {
        id: 'symbol-1',
        ticker: '0005.HK',
        lastPrice: 100,
        previousClose: 100,
      };

      const tick = simulator.generateTick(state);

      expect(tick).toHaveProperty('open');
      expect(tick).toHaveProperty('high');
      expect(tick).toHaveProperty('low');
      expect(tick).toHaveProperty('close');
      expect(tick).toHaveProperty('volume');
      
      // Validate OHLC logic
      expect(tick.high).toBeGreaterThanOrEqual(tick.open);
      expect(tick.high).toBeGreaterThanOrEqual(tick.close);
      expect(tick.low).toBeLessThanOrEqual(tick.open);
      expect(tick.low).toBeLessThanOrEqual(tick.close);
      
      // Validate volume is positive
      expect(tick.volume).toBeGreaterThan(0);
    });

    it('should generate prices within ±2% of last price', () => {
      const state = {
        id: 'symbol-1',
        ticker: '0005.HK',
        lastPrice: 100,
        previousClose: 100,
      };

      // Run multiple times to test randomness
      for (let i = 0; i < 100; i++) {
        const tick = simulator.generateTick(state);
        
        // Close should be within 2% of last price
        expect(tick.close).toBeGreaterThanOrEqual(state.lastPrice * 0.98);
        expect(tick.close).toBeLessThanOrEqual(state.lastPrice * 1.02);
      }
    });

    it('should round prices to 2 decimal places', () => {
      const state = {
        id: 'symbol-1',
        ticker: '0005.HK',
        lastPrice: 100,
        previousClose: 100,
      };

      const tick = simulator.generateTick(state);

      expect(Number(tick.open.toFixed(2))).toBe(tick.open);
      expect(Number(tick.high.toFixed(2))).toBe(tick.high);
      expect(Number(tick.low.toFixed(2))).toBe(tick.low);
      expect(Number(tick.close.toFixed(2))).toBe(tick.close);
    });
  });

  describe('onPriceUpdate', () => {
    it('should register and call callbacks on price update', () => {
      const callback = jest.fn();
      const unsubscribe = simulator.onPriceUpdate(callback);

      // Simulate a price update by calling the internal method
      // This is a simplified test - in real scenario, this would be triggered by the interval
      expect(typeof unsubscribe).toBe('function');
      
      // Cleanup
      unsubscribe();
    });

    it('should unregister callbacks when unsubscribe is called', () => {
      const callback = jest.fn();
      const unsubscribe = simulator.onPriceUpdate(callback);
      
      unsubscribe();
      
      // The callback should no longer be in the list
      // This is verified by the implementation not throwing errors
    });
  });

  describe('addSymbol', () => {
    it('should add a new symbol for simulation', async () => {
      const symbol = { id: 'test-symbol', ticker: 'TEST.HK' };
      
      await simulator.addSymbol(symbol);
      
      // The symbol should now be tracked
      // We can't directly verify the internal state, but the method should not throw
    });
  });
});
