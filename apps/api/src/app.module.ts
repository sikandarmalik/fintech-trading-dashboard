import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SymbolsModule } from './symbols/symbols.module';
import { MarketDataModule } from './market-data/market-data.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { WebsocketModule } from './websocket/websocket.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SymbolsModule,
    MarketDataModule,
    WatchlistModule,
    WebsocketModule,
  ],
})
export class AppModule {}
