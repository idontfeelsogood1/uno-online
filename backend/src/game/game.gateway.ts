import {
  SubscribeMessage,
  WebSocketGateway,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import {
  GameService,
  RemovedOrTransfered,
  PublicRoomState,
  PublicGameState,
} from './game.service';
import { Player } from './class/player/Player';
import { GameRoom } from './class/game-room/GameRoom';
import { randomUUID } from 'crypto';
import { ValidationPipe, UseFilters, UsePipes } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { WsValidationFilter } from './filter/ws-validation.filter';
import { WsRoomFilter } from './filter/ws-room.filter';
import { WsGameFilter } from './filter/ws-game.filter';
import { PlayCardsDto } from './dto/play-cards-dto';

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
  ): Promise<void> {
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

    client.emit('create-room-success', {
      roomState: this.service.generateRoomState(room),
    });
  }

  @SubscribeMessage('get-lobby')
  public getLobby(@ConnectedSocket() client: Socket): void {
    client.emit('get-lobby-success', {
      lobbyState: this.service.generateLobbyState(),
    });
  }

  @SubscribeMessage('join-room')
  @UseFilters(WsRoomFilter)
  public async joinRoom(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { roomToJoinId, username }: JoinRoomDto = data;

    this.service.isPlayerInAnyRoom(client.id);

    const player: Player = new Player(client.id, username);

    this.service.addPlayerToRoom(roomToJoinId, player);
    this.service.setPlayerOfRoom(player.socketId, roomToJoinId);

    await client.join(roomToJoinId);

    const room: GameRoom = this.service.getRoomOfPlayer(player.socketId)!;

    this.server.to(room.id).emit('player-joined-room', {
      socketId: player.socketId,
      username: player.username,
      roomState: this.service.generateRoomState(room),
    });
  }

  @SubscribeMessage('leave-room')
  @UseFilters(WsRoomFilter)
  public async leaveRoom(@ConnectedSocket() client: Socket): Promise<void> {
    await this.handleLeaveRoom(client);
  }

  // THIS RUNS AUTOMATICALLY WHEN CLIENT DISCONNECTS
  public async handleDisconnect(client: Socket): Promise<void> {
    await this.handleLeaveRoom(client);
  }

  private async handleLeaveRoom(client: Socket): Promise<void> {
    const room: GameRoom = this.service.getRoomOfPlayer(client.id)!;
    const player: Player = this.service.getPlayerOfRoom(room.id, client.id)!;
    const playerIndex: number | null = this.service.getIndexFromOrder(
      room,
      player,
    );

    this.service.pushCardBackToDrawPile(room, player);
    this.service.removePlayerFromRoom(room, player.socketId);
    this.service.removePlayerFromRoomPlayerOrder(room, player.socketId);

    // ONLY WORKS WHEN PREVIOUS PLAYER IS REMOVED FIRST
    this.service.setNewCurrentPlayerIndex(room, playerIndex);

    const result: RemovedOrTransfered =
      this.service.transferOwnerOrRemoveRoomOnEmpty(room)!;
    this.service.removeRoomOfPlayer(player.socketId);

    await client.leave(room.id);

    const lobbyState: PublicRoomState[] = this.service.generateLobbyState();
    const roomState: PublicRoomState = this.service.generateRoomState(room);
    const gameState: PublicGameState = this.service.generateGameState(room);

    client.emit('leave-room-success', {
      lobbyState: lobbyState,
    });

    if (room.hasStarted() && this.service.hasGameEnded(room)) {
      this.service.resetRoom(room);
      this.server.to(room.id).emit('game-ended', {
        loserSocketId: room.getPlayerFromOrder().socketId,
        loserUsername: room.getPlayerFromOrder().username,
        roomState: roomState,
        gameState: gameState,
      });
    }

    if (!result.removedRoom) {
      this.server.to(room.id).emit('player-left-room', {
        socketId: player.socketId,
        username: player.username,
        roomState: roomState,
      });
    }

    if (!result.removedRoom && result.transferedOwner) {
      this.server.to(room.id).emit('transfered-owner', {
        newOwnerSocketId: result.transferedOwner.socketId,
        newOwnerUsername: result.transferedOwner.username,
        roomState: roomState,
      });
    }
  }

  @SubscribeMessage('start-room')
  @UseFilters(WsRoomFilter)
  public startRoom(@ConnectedSocket() client: Socket): void {
    const room: GameRoom = this.service.getRoomOfPlayer(client.id)!;
    const player: Player = this.service.getPlayerOfRoom(room.id, client.id)!;

    this.service.startGame(room, player);

    this.server.to(room.id).emit('game-started', {
      gameState: this.service.generateGameState(room),
    });
  }

  // ===================
  // GAME LOGIC HANDLING
  // ===================

  @SubscribeMessage('draw-card')
  @UseFilters(WsRoomFilter, WsGameFilter)
  public drawCard(@ConnectedSocket() client: Socket): void {
    const room: GameRoom = this.service.getRoomOfPlayer(client.id)!;
    const player: Player = this.service.getPlayerOfRoom(room.id, client.id)!;

    this.service.hasRoomNotStarted(room);
    this.service.isPlayerTurn(room, player);
    this.service.drawCards(room, player, 1); // TRIGGERS CLEARING THE discardPile, KEEPING THE TOP CARD, PUSHING AND SHUFFLING CARDS TO drawPile WHEN drawPile is 0
    player.setIsUno(false);

    this.server.to(room.id).emit('player-drew-a-card', {
      socketId: player.socketId,
      username: player.username,
      gameState: this.service.generateGameState(room),
    });
  }

  // =====================================================================
  // STARTING FROM HERE REQUIRES A FRONTEND TO TEST, POSTMAN DOESNT CUT IT
  // =====================================================================

  @SubscribeMessage('uno')
  @UseFilters(WsRoomFilter, WsGameFilter)
  public uno(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: PlayCardsDto,
  ): void {
    const room: GameRoom = this.service.getRoomOfPlayer(client.id)!;
    const player: Player = this.service.getPlayerOfRoom(room.id, client.id)!;
    const { cardsToPlayIds }: PlayCardsDto = data;

    this.service.hasRoomNotStarted(room);
    this.service.isPlayerTurn(room, player);
    this.service.uno(player, cardsToPlayIds);

    this.playCards(client, data);
  }

  // THIS ROUTE SHOULD STOP THE GAME WHEN A PLAYER HAS WON AND HANDLE CLEANUP OPERATIONS
  @SubscribeMessage('play-cards')
  @UseFilters(WsRoomFilter, WsGameFilter)
  public playCards(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: PlayCardsDto,
  ): void {
    const room: GameRoom = this.service.getRoomOfPlayer(client.id)!;
    const player: Player = this.service.getPlayerOfRoom(room.id, client.id)!;
    const { cardsToPlayIds, wildColor }: PlayCardsDto = data;

    this.service.hasRoomNotStarted(room);
    this.service.isPlayerTurn(room, player);

    try {
      this.service.playCards(room, player, cardsToPlayIds, wildColor);
    } catch (err) {
      player.setIsUno(false);
      throw err;
    }

    // UPON PLAYER WON, THIS REMOVE THEM FROM ORDER AND SET NEW PLAYER INDEX
    const hasPlayerWon = this.service.processCurrentTurn(room);
    player.setIsUno(false);
    this.service.processNextTurn(room);

    const roomState: PublicRoomState = this.service.generateRoomState(room);
    const gameState: PublicGameState = this.service.generateGameState(room);

    if (this.service.hasGameEnded(room)) {
      this.service.resetRoom(room);
      this.server.to(room.id).emit('game-ended', {
        loserSocketId: room.getPlayerFromOrder().socketId,
        loserUsername: room.getPlayerFromOrder().username,
        roomState: roomState,
        gameState: gameState,
      });
    }
    if (hasPlayerWon) {
      this.server.to(room.id).emit('player-won', {
        socketId: player.socketId,
        username: player.username,
        gameState: gameState,
      });
    } else {
      this.server.to(room.id).emit('player-played-cards', {
        socketId: player.socketId,
        username: player.username,
        gameState: gameState,
      });
    }
  }
}
