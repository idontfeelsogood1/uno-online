import { IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGameDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(2, { message: 'Game must have at least 2 players' })
  @Max(4, { message: 'Game cannot have more than 4 players' })
  maxPlayers!: number;
}
