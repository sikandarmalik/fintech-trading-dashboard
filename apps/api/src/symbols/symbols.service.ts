import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SymbolDTO, SymbolListResponseDTO, PriceTickDTO } from '@trading/shared';

@Injectable()
export class SymbolsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, search?: string): Promise<SymbolListResponseDTO> {
    const skip = (page - 1) * limit;
    
    const where = search
      ? {
          OR: [
            { ticker: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [symbols, total] = await Promise.all([
      this.prisma.symbol.findMany({
        where,
        skip,
        take: limit,
        orderBy: { ticker: 'asc' },
      }),
      this.prisma.symbol.count({ where }),
    ]);

    return {
      data: symbols.map(this.toSymbolDTO),
      total,
      page,
      limit,
    };
  }

  async findByTicker(ticker: string): Promise<SymbolDTO | null> {
    const symbol = await this.prisma.symbol.findUnique({
      where: { ticker },
    });
    return symbol ? this.toSymbolDTO(symbol) : null;
  }

  async getHistory(
    ticker: string,
    limit = 500,
  ): Promise<PriceTickDTO[]> {
    const symbol = await this.prisma.symbol.findUnique({
      where: { ticker },
    });

    if (!symbol) {
      return [];
    }

    const ticks = await this.prisma.priceTick.findMany({
      where: { symbolId: symbol.id },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return ticks.reverse().map((tick) => ({
      id: tick.id,
      symbolId: tick.symbolId,
      ticker,
      timestamp: tick.timestamp,
      open: tick.open,
      high: tick.high,
      low: tick.low,
      close: tick.close,
      volume: tick.volume,
    }));
  }

  async createSymbol(data: { ticker: string; name: string; market: string }): Promise<SymbolDTO> {
    const symbol = await this.prisma.symbol.create({
      data,
    });
    return this.toSymbolDTO(symbol);
  }

  async getAllTickers(): Promise<string[]> {
    const symbols = await this.prisma.symbol.findMany({
      select: { ticker: true },
    });
    return symbols.map((s) => s.ticker);
  }

  private toSymbolDTO(symbol: { id: string; ticker: string; name: string; market: string }): SymbolDTO {
    return {
      id: symbol.id,
      ticker: symbol.ticker,
      name: symbol.name,
      market: symbol.market,
    };
  }
}
