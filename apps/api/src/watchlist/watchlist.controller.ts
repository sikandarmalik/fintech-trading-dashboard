import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateWatchlistDto } from './dto/create-watchlist.dto';
import { AddItemDto } from './dto/add-item.dto';
import type { WatchlistDTO, WatchlistItemDTO, UserDTO } from '@trading/shared';

@Controller('watchlists')
@UseGuards(JwtAuthGuard)
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  async findAll(@Request() req: { user: UserDTO }): Promise<WatchlistDTO[]> {
    return this.watchlistService.findAllByUser(req.user.id);
  }

  @Post()
  async create(
    @Request() req: { user: UserDTO },
    @Body() createDto: CreateWatchlistDto,
  ): Promise<WatchlistDTO> {
    return this.watchlistService.create(req.user.id, createDto.name);
  }

  @Post(':id/items')
  async addItem(
    @Request() req: { user: UserDTO },
    @Param('id') id: string,
    @Body() addItemDto: AddItemDto,
  ): Promise<WatchlistItemDTO> {
    return this.watchlistService.addItem(id, req.user.id, addItemDto.symbol);
  }

  @Delete(':id/items/:itemId')
  async removeItem(
    @Request() req: { user: UserDTO },
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<void> {
    return this.watchlistService.removeItem(id, itemId, req.user.id);
  }

  @Delete(':id')
  async delete(
    @Request() req: { user: UserDTO },
    @Param('id') id: string,
  ): Promise<void> {
    return this.watchlistService.deleteWatchlist(id, req.user.id);
  }
}
