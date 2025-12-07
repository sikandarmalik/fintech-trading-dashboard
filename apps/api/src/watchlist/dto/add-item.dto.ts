import { IsString, MinLength, MaxLength } from 'class-validator';

export class AddItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  symbol: string;
}
