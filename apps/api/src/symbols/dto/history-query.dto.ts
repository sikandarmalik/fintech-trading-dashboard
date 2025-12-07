import { IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class HistoryQueryDto {
  @IsOptional()
  @IsIn(['1m', '5m', '15m', '1h', '1d'])
  interval?: string = '1m';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 500;
}
