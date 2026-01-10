import { IsString, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  roomname: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(2, { message: 'Room must have at least 2 players' })
  @Max(4, { message: 'Room cannot have more than 10 players' })
  maxPlayers: number;
}
