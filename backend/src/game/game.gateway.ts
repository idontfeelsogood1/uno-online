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
import { JoinRoomDto } from './dto/join-room.dto';
import { WsValidationFilter } from './filter/ws-validation.filter';
import { WsRoomFilter } from './filter/ws-room.filter';

@WebSocketGateway()
@UseFilters(WsValidationFilter, WsRoomFilter)
export class GameGateway {
  constructor(private readonly service: GameService) {}

  @SubscribeMessage('create-room')
  @UsePipes(new ValidationPipe({ transform: true }))
  public async createRoom(
    @MessageBody() data: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ): Promise<string> {
    const { username, roomname, maxPlayers }: CreateRoomDto = data;

    this.service.isPlayerInAnyRoom(client.id);

    const playerSocketId: string = client.id;

    const owner: Player = new Player(playerSocketId, username);
    const room: GameRoom = this.service.createRoom(
      randomUUID(),
      roomname,
      playerSocketId,
      maxPlayers,
    );

    this.service.addRoom(room);
    this.service.addPlayerToRoom(room.id, owner);
    this.service.setPlayerOfRoom(playerSocketId, room.id);

    await client.join(room.id);

    console.log(room.id);

    client.emit('created-room-success');
    return `Successfully created and joined player to room ${room.name}.`;
  }

  @SubscribeMessage('join-room')
  @UsePipes(new ValidationPipe({ transform: true }))
  public async joinRoom(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ): Promise<string> {
    // CREATE A NEW PLAYER AND JOIN THEM TO THE ROOM
    const { roomToJoinId, username }: JoinRoomDto = data;

    this.service.isPlayerInAnyRoom(client.id);

    const player: Player = new Player(client.id, username);

    this.service.addPlayerToRoom(roomToJoinId, player);
    this.service.setPlayerOfRoom(player.socketId, roomToJoinId);

    await client.join(roomToJoinId);

    const room: GameRoom = this.service.getRoomOfPlayer(player.socketId)!;

    client.emit('joined-room-success');
    return `Succesfully joined player to room ${room.name}.`;
  }
}
