import {
  SubscribeMessage,
  WebSocketGateway,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { GameService } from './game.service';
import { Player } from './class/player/Player';
import { GameRoom } from './class/game-room/GameRoom';
import { randomUUID } from 'crypto';
import { ValidationPipe, UseFilters, UsePipes } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { WsValidationFilter } from './filter/ws-validation.filter';

@WebSocketGateway()
@UseFilters(WsValidationFilter)
export class GameGateway {
  constructor(private readonly service: GameService) {}

  @SubscribeMessage('create-room')
  @UsePipes(new ValidationPipe())
  async handleEvent(
    @MessageBody() data: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ): Promise<string> {
    try {
      const { username, roomname, maxPlayers }: CreateRoomDto = data;
      const playerSocketId: string = client.id;

      const owner: Player = new Player(playerSocketId, username);
      const room: GameRoom = this.service.createRoom(
        randomUUID(),
        roomname,
        playerSocketId,
        parseInt(maxPlayers),
      );

      await client.join(room.id);

      this.service.addRoom(room);
      this.service.addPlayerToRoom(room.id, owner);

      return 'Successfully created and joined player to room';
    } catch (err) {
      console.log(err);
      return 'Failed to create and joined player to room';
    }
  }
}
