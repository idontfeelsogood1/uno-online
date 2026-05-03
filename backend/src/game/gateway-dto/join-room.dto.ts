import { IsString, IsNotEmpty } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  roomToJoinId: string;

  @IsString()
  @IsNotEmpty()
  username: string;
}
