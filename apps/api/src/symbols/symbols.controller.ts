import { Controller, Get, Param, Query } from '@nestjs/common';
import { SymbolsService } from './symbols.service';
import { SymbolQueryDto } from './dto/symbol-query.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import type { SymbolListResponseDTO, PriceTickDTO } from '@trading/shared';

@Controller('symbols')
export class SymbolsController {
  constructor(private readonly symbolsService: SymbolsService) {}

  @Get()
  async findAll(@Query() query: SymbolQueryDto): Promise<SymbolListResponseDTO> {
    return this.symbolsService.findAll(query.page, query.limit, query.search);
  }

  @Get(':ticker/history')
  async getHistory(
    @Param('ticker') ticker: string,
    @Query() query: HistoryQueryDto,
  ): Promise<PriceTickDTO[]> {
    return this.symbolsService.getHistory(ticker, query.limit);
  }
}
