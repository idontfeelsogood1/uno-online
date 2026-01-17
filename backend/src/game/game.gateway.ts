import {
  SubscribeMessage,
  WebSocketGateway,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GameService, RemovedOrTransfered } from './game.service';
import { Player } from './class/player/Player';
import { GameRoom } from './class/game-room/GameRoom';
import { randomUUID } from 'crypto';
import { ValidationPipe, UseFilters, UsePipes } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { WsValidationFilter } from './filter/ws-validation.filter';
import { WsRoomFilter } from './filter/ws-room.filter';
import { WsGameFilter } from './filter/ws-game.filter';

@WebSocketGateway()
@UsePipes(new ValidationPipe({ transform: true }))
@UseFilters(WsValidationFilter)
export class GameGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly service: GameService) {}

  // ===============================
  // ROOM AND DISCONNECTION HANDLING
  // ===============================

  @SubscribeMessage('create-room')
  @UseFilters(WsRoomFilter)
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

    client.emit('created-room-success');
    this.server.emit('room-created', { roomname: `${room.name}` });
    return `Successfully created and joined ${owner.socketId} to room ${room.id}.`;
  }

  @SubscribeMessage('join-room')
  @UseFilters(WsRoomFilter)
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
    this.server
      .to(room.id)
      .emit('player-joined-room', { username: `${player.username}` });
    return `Succesfully joined ${player.socketId} to room ${room.id}.`;
  }

  @SubscribeMessage('leave-room')
  @UseFilters(WsRoomFilter)
  public async leaveRoom(@ConnectedSocket() client: Socket): Promise<string> {
    const room: GameRoom = this.service.getRoomOfPlayer(client.id)!;
    const player: Player = this.service.getPlayerOfRoom(room.id, client.id)!;

    await this.handleLeaveRoom(client);

    client.emit('leave-room-success');
    return `Succesfully removed ${player.socketId} from room ${room.id}.`;
  }

  // THIS RUNS AUTOMATICALLY WHEN CLIENT DISCONNECTS
  public async handleDisconnect(client: Socket): Promise<void> {
    try {
      await this.handleLeaveRoom(client);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // PREVENT SERVER CRASH WHEN PLAYER DISCONNECTS BUT NOT IN A ROOM
      return;
    }
  }

  private async handleLeaveRoom(client: Socket): Promise<void> {
    // EDGE CASEs:
    // HANDLE currentPlayerIndex (player's turn transfer) DEPENDING ON DIRECTION WHEN PLAYER DISCONNECTS
    // HANDLE PUSHING PLAYER'S HAND BACK TO DRAWPILE WHEN THEY DISCONNECT OR LEAVE

    const room: GameRoom = this.service.getRoomOfPlayer(client.id)!;
    const player: Player = this.service.getPlayerOfRoom(room.id, client.id)!;

    this.service.setNewCurrentPlayerIndex(room.id, player.id);
    this.service.pushCardBackToDrawPile(room.id, player.id);

    this.service.removePlayerFromRoom(room.id, client.id);
    this.service.removePlayerFromRoomPlayerOrder(room.id, client.id);

    const result: RemovedOrTransfered =
      this.service.transferOwnerOrRemoveRoomOnEmpty(room.id)!;
    this.service.removeRoomOfPlayer(client.id);

    await client.leave(room.id);

    if (result.removedRoom) {
      this.server.emit('room-removed', { roomId: result.removedRoom.id });
    } else {
      this.server
        .to(room.id)
        .emit('player-left-room', { username: player.username });
    }

    if (!result.removedRoom && result.transferedOwner) {
      this.server.to(room.id).emit('transfered-owner', {
        username: result.transferedOwner.username,
      });
    }
  }

  @SubscribeMessage('start-room')
  @UseFilters(WsRoomFilter)
  public startRoom(@ConnectedSocket() client: Socket): string {
    const room: GameRoom = this.service.getRoomOfPlayer(client.id)!;
    const player: Player = this.service.getPlayerOfRoom(room.id, client.id)!;

    this.service.startGame(room, player);

    this.server.to(room.id).emit('game-started', { status: 'Started' });
    this.server.emit('room-started', { roomId: `${room.id}` });
    return `Successfully started game`;
  }

  // ===================
  // GAME LOGIC HANDLING
  // ===================

  @SubscribeMessage('draw-card')
  @UseFilters(WsRoomFilter, WsGameFilter)
  public drawCard(@ConnectedSocket() client: Socket) {
    const room: GameRoom = this.service.getRoomOfPlayer(client.id)!;
    const player: Player = this.service.getPlayerOfRoom(room.id, client.id)!;

    console.log(room.hasStarted());
    this.service.hasRoomNotStarted(room);
    this.service.isPlayerTurn(room, player);
    // SHOULD RETURN ActionResult OBJECT LATER
    this.service.drawCards(room, player, 1); // CURRENT THROWS AmountGreaterThanDrawPile IF DRAW PILE IS 0
    player.setIsUno(false);

    // SHOULD EMIT ActionResult LATER
    client.emit('draw-card-success');
    this.server.to(room.id).emit('player-drew-a-card', {
      username: `${player.username}`,
      playerHandLength: `${player.getHand().length}`,
    });
    return `Drew 1 card to ${player.username}'s hand`;
  }
}
