import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import type { WatchlistDTO, WatchlistItemDTO } from '@trading/shared';

@Injectable()
export class WatchlistService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string): Promise<WatchlistDTO[]> {
    const watchlists = await this.prisma.watchlist.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return watchlists.map(this.toWatchlistDTO);
  }

  async findById(id: string, userId: string): Promise<WatchlistDTO> {
    const watchlist = await this.prisma.watchlist.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!watchlist) {
      throw new NotFoundException('Watchlist not found');
    }

    if (watchlist.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.toWatchlistDTO(watchlist);
  }

  async create(userId: string, name: string): Promise<WatchlistDTO> {
    const watchlist = await this.prisma.watchlist.create({
      data: {
        userId,
        name,
      },
      include: { items: true },
    });

    return this.toWatchlistDTO(watchlist);
  }

  async addItem(watchlistId: string, userId: string, symbol: string): Promise<WatchlistItemDTO> {
    // Verify ownership
    const watchlist = await this.prisma.watchlist.findUnique({
      where: { id: watchlistId },
    });

    if (!watchlist) {
      throw new NotFoundException('Watchlist not found');
    }

    if (watchlist.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    try {
      const item = await this.prisma.watchlistItem.create({
        data: {
          watchlistId,
          symbol,
        },
      });

      return this.toWatchlistItemDTO(item);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Symbol already exists in this watchlist');
        }
      }
      throw error;
    }
  }

  async removeItem(watchlistId: string, itemId: string, userId: string): Promise<void> {
    // Verify ownership
    const watchlist = await this.prisma.watchlist.findUnique({
      where: { id: watchlistId },
    });

    if (!watchlist) {
      throw new NotFoundException('Watchlist not found');
    }

    if (watchlist.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const item = await this.prisma.watchlistItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.watchlistId !== watchlistId) {
      throw new NotFoundException('Item not found');
    }

    await this.prisma.watchlistItem.delete({
      where: { id: itemId },
    });
  }

  async deleteWatchlist(id: string, userId: string): Promise<void> {
    const watchlist = await this.prisma.watchlist.findUnique({
      where: { id },
    });

    if (!watchlist) {
      throw new NotFoundException('Watchlist not found');
    }

    if (watchlist.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.watchlist.delete({
      where: { id },
    });
  }

  private toWatchlistDTO = (watchlist: {
    id: string;
    userId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    items: { id: string; watchlistId: string; symbol: string; createdAt: Date }[];
  }): WatchlistDTO => {
    return {
      id: watchlist.id,
      userId: watchlist.userId,
      name: watchlist.name,
      createdAt: watchlist.createdAt,
      updatedAt: watchlist.updatedAt,
      items: watchlist.items.map((item) => this.toWatchlistItemDTO(item)),
    };
  };

  private toWatchlistItemDTO = (item: {
    id: string;
    watchlistId: string;
    symbol: string;
    createdAt: Date;
  }): WatchlistItemDTO => {
    return {
      id: item.id,
      watchlistId: item.watchlistId,
      symbol: item.symbol,
      createdAt: item.createdAt,
    };
  };
}
