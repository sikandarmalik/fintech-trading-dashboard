import { Module } from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import { MarketDataSimulator } from './market-data-simulator.service';
import { SymbolsModule } from '../symbols/symbols.module';

@Module({
  imports: [SymbolsModule],
  providers: [MarketDataService, MarketDataSimulator],
  exports: [MarketDataService, MarketDataSimulator],
})
export class MarketDataModule {}
