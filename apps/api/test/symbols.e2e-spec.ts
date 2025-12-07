import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Symbols (e2e)', () => {
  let app: INestApplication;

  const mockSymbols = [
    { id: '1', ticker: '0005.HK', name: 'HSBC Holdings', market: 'HKEX' },
    { id: '2', ticker: '0700.HK', name: 'Tencent Holdings', market: 'HKEX' },
  ];

  const mockPriceTicks = [
    {
      id: 'tick-1',
      symbolId: '1',
      timestamp: new Date(),
      open: 100,
      high: 102,
      low: 99,
      close: 101,
      volume: 10000,
      symbol: { ticker: '0005.HK' },
    },
  ];

  const mockPrismaService = {
    symbol: {
      findMany: jest.fn().mockResolvedValue(mockSymbols),
      findUnique: jest.fn().mockResolvedValue(mockSymbols[0]),
      count: jest.fn().mockResolvedValue(2),
    },
    priceTick: {
      findMany: jest.fn().mockResolvedValue(mockPriceTicks),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/symbols (GET)', () => {
    it('should return paginated list of symbols', async () => {
      const response = await request(app.getHttpServer())
        .get('/symbols')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should accept pagination parameters', async () => {
      await request(app.getHttpServer())
        .get('/symbols?page=1&limit=10')
        .expect(200);

      expect(mockPrismaService.symbol.findMany).toHaveBeenCalled();
    });

    it('should accept search parameter', async () => {
      await request(app.getHttpServer())
        .get('/symbols?search=HSBC')
        .expect(200);
    });
  });

  describe('/symbols/:ticker/history (GET)', () => {
    it('should return historical price data', async () => {
      const response = await request(app.getHttpServer())
        .get('/symbols/0005.HK/history')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should accept limit parameter', async () => {
      await request(app.getHttpServer())
        .get('/symbols/0005.HK/history?limit=100')
        .expect(200);
    });

    it('should accept interval parameter', async () => {
      await request(app.getHttpServer())
        .get('/symbols/0005.HK/history?interval=1m')
        .expect(200);
    });
  });
});
