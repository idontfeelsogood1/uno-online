import 'dotenv/config';
import {
  SubscribeMessage,
  WebSocketGateway,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GamePlayerService } from './game-player.service';
import {
  PublicRoomState,
  PublicGameState,
} from '../service-interface/service-interface';
import {
  PlayerNotInAnyRoom,
  RemovedOrTransfered,
} from '../service-exception/service-exception';
import { Player } from '../model/player/Player';
import { GameRoom } from '../model/game-room/GameRoom';
import { randomUUID } from 'crypto';
import { ValidationPipe, UseFilters, UsePipes } from '@nestjs/common';
import { CreateRoomDto } from '../gateway-dto/create-room.dto';
import { JoinRoomDto } from '../gateway-dto/join-room.dto';
import { WsValidationFilter } from '../gateway-filter/ws-validation.filter';
import { WsRoomFilter } from '../gateway-filter/ws-room.filter';
import { WsGameFilter } from '../gateway-filter/ws-game.filter';
import { PlayCardsDto } from '../gateway-dto/play-cards-dto';
import { Card } from '../model/card/Card';
import { GameEngine } from '../engine/game.engine';

let originUrl: string;
if (process.env.NODE_ENV === 'dev') {
  originUrl = '*';
} else {
  originUrl = process.env.FRONTEND_URL!;
}

@WebSocketGateway({
  namespace: process.env.GAME_GATEWAY_NAMESPACE,
  cors: {
    origin: originUrl,
    credentials: true,
  },
})
@UsePipes(new ValidationPipe({ transform: true }))
@UseFilters(WsValidationFilter)
export class GamePlayerGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly service: GamePlayerService,
    private readonly engine: GameEngine,
  ) {}

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

    client.emit('room-state-update', {
      actionType: 'create-room',
      roomState: this.service.generateRoomState(room),
    });
  }

  @SubscribeMessage('get-lobby')
  public getLobby(@ConnectedSocket() client: Socket): void {
    client.emit('lobby-state-update', {
      actionType: 'get-lobby',
      lobbyState: this.service.generateLobbyState(),
    });
  }

  @SubscribeMessage('get-room-state')
  public getRoomState(@ConnectedSocket() client: Socket): object {
    const room: GameRoom = this.service.getRoomOfPlayer(client.id)!;
    return {
      roomState: this.service.generateRoomState(room),
    };
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

    client.emit('room-state-update', {
      actionType: 'join-room',
      roomState: this.service.generateRoomState(room),
    });

    this.server.to(room.id).emit('room-state-update', {
      actionType: 'player-joined-room',
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
  public async handleDisconnect(
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      await this.handleLeaveRoom(client);
      // PREVENTS SERVER CRASH WHEN PLAYER IS NOT IN ANY ROOM
    } catch (err) {
      if (err instanceof PlayerNotInAnyRoom) {
        console.log(`${client.id} disconnected.`);
      }
    }
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
    this.engine.setNewCurrentPlayerIndex(room, playerIndex);

    const result: RemovedOrTransfered =
      this.service.transferOwnerOrRemoveRoomOnEmpty(room)!;
    this.service.removeRoomOfPlayer(player.socketId);

    await client.leave(room.id);

    const lobbyState: PublicRoomState[] = this.service.generateLobbyState();
    const roomState: PublicRoomState | null = !result.removedRoom
      ? this.service.generateRoomState(room)
      : null;
    const gameState: PublicGameState | null = !result.removedRoom
      ? this.engine.generateGameState(room)
      : null;

    client.emit('room-state-update', {
      actionType: 'leave-room',
      lobbyState: lobbyState,
    });

    if (!result.removedRoom) {
      this.server.to(room.id).emit('room-state-update', {
        actionType: 'player-left-room',
        socketId: player.socketId,
        username: player.username,
        roomState: roomState,
      });
    }

    if (!result.removedRoom && result.transferedOwner) {
      this.server.to(room.id).emit('room-state-update', {
        actionType: 'transfered-owner',
        socketId: result.transferedOwner.socketId,
        username: result.transferedOwner.username,
        roomState: roomState,
      });
    }

    if (room.hasStarted()) {
      this.server.to(room.id).emit('game-state-update', {
        actionType: 'player-left',
        socketId: player.socketId,
        username: player.username,
        gameState: gameState,
      });
    }

    if (room.hasStarted() && this.engine.hasGameEnded(room)) {
      this.service.resetRoom(room);
      this.server.to(room.id).emit('game-state-update', {
        actionType: 'game-ended',
        socketId: player.socketId,
        username: player.username,
        gameState: gameState,
      });
    }
  }

  @SubscribeMessage('start-room')
  @UseFilters(WsRoomFilter)
  public startRoom(@ConnectedSocket() client: Socket): void {
    const room: GameRoom = this.service.getRoomOfPlayer(client.id)!;
    const player: Player = this.service.getPlayerOfRoom(room.id, client.id)!;

    this.service.startGame(room, player);

    this.server.to(room.id).emit('game-state-update', {
      actionType: 'game-started',
      gameState: this.engine.generateGameState(room),
    });
  }

  // ===================
  // GAME LOGIC HANDLING
  // ===================

  @SubscribeMessage('get-game-state')
  public getGameState(@ConnectedSocket() client: Socket): object {
    const room: GameRoom = this.service.getRoomOfPlayer(client.id)!;
    return {
      gameState: this.engine.generateGameState(room),
    };
  }

  @SubscribeMessage('draw-card')
  @UseFilters(WsRoomFilter, WsGameFilter)
  public drawCard(@ConnectedSocket() client: Socket): void {
    const room: GameRoom = this.service.getRoomOfPlayer(client.id)!;
    const player: Player = this.service.getPlayerOfRoom(room.id, client.id)!;

    this.service.hasRoomNotStarted(room);
    this.engine.isPlayerTurn(room, player);
    this.engine.drawCards(room, player, 1);

    this.server.to(room.id).emit('game-state-update', {
      actionType: 'draw-cards',
      socketId: player.socketId,
      username: player.username,
      gameState: this.engine.generateGameState(room),
      cardDrew: player.getHand()[player.getHand().length - 1],
    });
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
    const { cardsToPlayIds, wildColor, uno }: PlayCardsDto = data;
    const playedCards: Card[] = player.getCardsToPlay(cardsToPlayIds);

    this.service.hasRoomNotStarted(room);
    this.engine.isPlayerTurn(room, player);
    this.engine.playCards(room, player, cardsToPlayIds, wildColor);
    if (uno) player.setIsUno(true);
    this.engine.processCurrentTurn(room);
    this.engine.processNextTurn(room);

    const gameState: PublicGameState = this.engine.generateGameState(room);

    if (this.engine.hasGameEnded(room)) {
      this.service.resetRoom(room);
      this.server.to(room.id).emit('game-state-update', {
        actionType: 'game-ended',
        socketId: player.socketId,
        username: player.username,
        gameState: gameState,
      });
    } else {
      this.server.to(room.id).emit('game-state-update', {
        actionType: 'played-cards',
        socketId: player.socketId,
        username: player.username,
        gameState: gameState,
        playedCards: playedCards,
      });
    }
  }
}
