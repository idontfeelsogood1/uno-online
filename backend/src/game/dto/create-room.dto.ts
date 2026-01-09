import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  roomname: string;

  @IsNotEmpty()
  @IsEnum(['2', '3', '4'])
  maxPlayers: string;
}
