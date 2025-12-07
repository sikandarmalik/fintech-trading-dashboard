import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PriceTickDTO } from '@trading/shared';

@Injectable()
export class MarketDataService {
  constructor(private readonly prisma: PrismaService) {}

  async savePriceTick(data: {
    symbolId: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }): Promise<PriceTickDTO> {
    const tick = await this.prisma.priceTick.create({
      data: {
        symbolId: data.symbolId,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume,
      },
      include: {
        symbol: true,
      },
    });

    return {
      id: tick.id,
      symbolId: tick.symbolId,
      ticker: tick.symbol.ticker,
      timestamp: tick.timestamp,
      open: tick.open,
      high: tick.high,
      low: tick.low,
      close: tick.close,
      volume: tick.volume,
    };
  }

  async getLatestPrices(symbolIds: string[]): Promise<Map<string, PriceTickDTO>> {
    const result = new Map<string, PriceTickDTO>();
    
    for (const symbolId of symbolIds) {
      const tick = await this.prisma.priceTick.findFirst({
        where: { symbolId },
        orderBy: { timestamp: 'desc' },
        include: { symbol: true },
      });

      if (tick) {
        result.set(tick.symbol.ticker, {
          id: tick.id,
          symbolId: tick.symbolId,
          ticker: tick.symbol.ticker,
          timestamp: tick.timestamp,
          open: tick.open,
          high: tick.high,
          low: tick.low,
          close: tick.close,
          volume: tick.volume,
        });
      }
    }

    return result;
  }
}
