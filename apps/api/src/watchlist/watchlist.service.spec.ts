import { Test, TestingModule } from '@nestjs/testing';
import { WatchlistService } from './watchlist.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('WatchlistService', () => {
  let service: WatchlistService;

  const mockWatchlist = {
    id: 'watchlist-1',
    userId: 'user-1',
    name: 'My Watchlist',
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 'item-1',
        watchlistId: 'watchlist-1',
        symbol: '0005.HK',
        createdAt: new Date(),
      },
    ],
  };

  const mockPrismaService = {
    watchlist: {
      findMany: jest.fn().mockResolvedValue([mockWatchlist]),
      findUnique: jest.fn().mockResolvedValue(mockWatchlist),
      create: jest.fn().mockResolvedValue({ ...mockWatchlist, items: [] }),
      delete: jest.fn().mockResolvedValue(mockWatchlist),
    },
    watchlistItem: {
      create: jest.fn().mockResolvedValue(mockWatchlist.items[0]),
      findUnique: jest.fn().mockResolvedValue(mockWatchlist.items[0]),
      delete: jest.fn().mockResolvedValue(mockWatchlist.items[0]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchlistService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WatchlistService>(WatchlistService);
    jest.clearAllMocks();
  });

  describe('findAllByUser', () => {
    it('should return all watchlists for a user', async () => {
      const result = await service.findAllByUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('watchlist-1');
      expect(result[0].name).toBe('My Watchlist');
      expect(result[0].items).toHaveLength(1);
      expect(mockPrismaService.watchlist.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('should return a watchlist by id for authorized user', async () => {
      const result = await service.findById('watchlist-1', 'user-1');

      expect(result.id).toBe('watchlist-1');
      expect(mockPrismaService.watchlist.findUnique).toHaveBeenCalledWith({
        where: { id: 'watchlist-1' },
        include: { items: true },
      });
    });

    it('should throw NotFoundException if watchlist does not exist', async () => {
      mockPrismaService.watchlist.findUnique.mockResolvedValueOnce(null);

      await expect(service.findById('non-existent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own watchlist', async () => {
      await expect(
        service.findById('watchlist-1', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should create a new watchlist', async () => {
      const result = await service.create('user-1', 'New Watchlist');

      expect(result.name).toBe('My Watchlist'); // Mocked return value
      expect(mockPrismaService.watchlist.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          name: 'New Watchlist',
        },
        include: { items: true },
      });
    });
  });

  describe('addItem', () => {
    it('should add an item to a watchlist', async () => {
      const result = await service.addItem('watchlist-1', 'user-1', '0700.HK');

      expect(result.symbol).toBe('0005.HK'); // Mocked return value
      expect(mockPrismaService.watchlistItem.create).toHaveBeenCalledWith({
        data: {
          watchlistId: 'watchlist-1',
          symbol: '0700.HK',
        },
      });
    });

    it('should throw NotFoundException if watchlist does not exist', async () => {
      mockPrismaService.watchlist.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.addItem('non-existent', 'user-1', '0700.HK'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own watchlist', async () => {
      await expect(
        service.addItem('watchlist-1', 'other-user', '0700.HK'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeItem', () => {
    it('should remove an item from a watchlist', async () => {
      await service.removeItem('watchlist-1', 'item-1', 'user-1');

      expect(mockPrismaService.watchlistItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
    });

    it('should throw NotFoundException if watchlist does not exist', async () => {
      mockPrismaService.watchlist.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.removeItem('non-existent', 'item-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own watchlist', async () => {
      await expect(
        service.removeItem('watchlist-1', 'item-1', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if item does not exist', async () => {
      mockPrismaService.watchlistItem.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.removeItem('watchlist-1', 'non-existent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteWatchlist', () => {
    it('should delete a watchlist', async () => {
      await service.deleteWatchlist('watchlist-1', 'user-1');

      expect(mockPrismaService.watchlist.delete).toHaveBeenCalledWith({
        where: { id: 'watchlist-1' },
      });
    });

    it('should throw NotFoundException if watchlist does not exist', async () => {
      mockPrismaService.watchlist.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.deleteWatchlist('non-existent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own watchlist', async () => {
      await expect(
        service.deleteWatchlist('watchlist-1', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
