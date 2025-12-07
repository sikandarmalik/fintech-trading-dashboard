import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from './market-data.service';
import type { RealtimePriceUpdateDTO } from '@trading/shared';

interface SymbolState {
  id: string;
  ticker: string;
  lastPrice: number;
  previousClose: number;
}

@Injectable()
export class MarketDataSimulator implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MarketDataSimulator.name);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private symbolStates: Map<string, SymbolState> = new Map();
  
  // Event emitter for price updates (will be consumed by WebSocket gateway)
  private priceUpdateCallbacks: ((update: RealtimePriceUpdateDTO) => void)[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly marketDataService: MarketDataService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.initializeSymbolStates();
    this.startSimulation();
  }

  onModuleDestroy() {
    this.stopSimulation();
  }

  onPriceUpdate(callback: (update: RealtimePriceUpdateDTO) => void) {
    this.priceUpdateCallbacks.push(callback);
    return () => {
      const index = this.priceUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.priceUpdateCallbacks.splice(index, 1);
      }
    };
  }

  private emitPriceUpdate(update: RealtimePriceUpdateDTO) {
    this.priceUpdateCallbacks.forEach((callback) => callback(update));
  }

  private async initializeSymbolStates() {
    const symbols = await this.prisma.symbol.findMany();
    
    for (const symbol of symbols) {
      // Get last price or generate random starting price
      const lastTick = await this.prisma.priceTick.findFirst({
        where: { symbolId: symbol.id },
        orderBy: { timestamp: 'desc' },
      });

      const initialPrice = lastTick?.close ?? this.generateInitialPrice(symbol.ticker);
      
      this.symbolStates.set(symbol.ticker, {
        id: symbol.id,
        ticker: symbol.ticker,
        lastPrice: initialPrice,
        previousClose: initialPrice,
      });
    }

    this.logger.log(`Initialized ${this.symbolStates.size} symbols for simulation`);
  }

  private generateInitialPrice(ticker: string): number {
    // Generate reasonable starting prices based on market
    // Hong Kong stocks typically range from a few HKD to a few hundred
    const basePrice = Math.random() * 200 + 10;
    return Math.round(basePrice * 100) / 100;
  }

  startSimulation() {
    if (this.intervalId) return;

    const interval = this.configService.get<number>('SIMULATION_INTERVAL', 1000);
    
    this.intervalId = setInterval(() => {
      this.generatePriceTicks();
    }, interval);

    this.logger.log(`Market data simulation started (interval: ${interval}ms)`);
  }

  stopSimulation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.log('Market data simulation stopped');
    }
  }

  private async generatePriceTicks() {
    for (const [ticker, state] of this.symbolStates) {
      try {
        const newTick = this.generateTick(state);
        
        // Save to database
        await this.marketDataService.savePriceTick({
          symbolId: state.id,
          open: newTick.open,
          high: newTick.high,
          low: newTick.low,
          close: newTick.close,
          volume: newTick.volume,
        });

        // Update state
        state.lastPrice = newTick.close;

        // Emit update for WebSocket
        const update: RealtimePriceUpdateDTO = {
          ticker,
          timestamp: new Date(),
          open: newTick.open,
          high: newTick.high,
          low: newTick.low,
          close: newTick.close,
          volume: newTick.volume,
          change: newTick.close - state.previousClose,
          changePercent: ((newTick.close - state.previousClose) / state.previousClose) * 100,
        };

        this.emitPriceUpdate(update);
      } catch (error) {
        this.logger.error(`Error generating tick for ${ticker}:`, error);
      }
    }
  }

  generateTick(state: SymbolState): {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } {
    const lastPrice = state.lastPrice;
    
    // Generate realistic price movement (max ±2% per tick)
    const volatility = 0.02;
    const priceChange = lastPrice * volatility * (Math.random() - 0.5);
    
    const open = lastPrice;
    const close = Math.max(0.01, lastPrice + priceChange);
    
    // High and low within the range
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    
    // Random volume between 1000 and 100000
    const volume = Math.floor(Math.random() * 99000) + 1000;

    return {
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    };
  }

  // For testing purposes
  async addSymbol(symbol: { id: string; ticker: string }) {
    const initialPrice = this.generateInitialPrice(symbol.ticker);
    this.symbolStates.set(symbol.ticker, {
      id: symbol.id,
      ticker: symbol.ticker,
      lastPrice: initialPrice,
      previousClose: initialPrice,
    });
  }
}
