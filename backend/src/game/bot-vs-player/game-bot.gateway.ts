import 'dotenv/config';
import {
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Player } from '../model/player/Player';
import { GameRoom } from '../model/game-room/GameRoom';
import { GameBotService } from './game-bot.service';
import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { CreateGameDto } from '../gateway-dto/create-game.dto';
import { randomUUID } from 'crypto';
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
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
  namespace: 'PlayerVsBot',
  cors: {
    origin: originUrl,
    credentials: true,
  },
})
@UsePipes(new ValidationPipe({ transform: true }))
@UseFilters(WsValidationFilter)
export class GameBotGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly service: GameBotService,
    private readonly engine: GameEngine,
  ) {}

  @SubscribeMessage('create-game')
  public async createGame(
    @MessageBody() data: CreateGameDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { maxPlayers }: CreateGameDto = data;

    const playerSocketId: string = client.id;
    const owner: Player = new Player(playerSocketId, 'Player (Owner)');

    const room: GameRoom = this.service.createRoom(
      randomUUID(),
      'Bot Room', // ROOMNAME
      playerSocketId,
      maxPlayers,
    );

    this.service.setPlayerOfRoom(room, owner);
    this.service.addBotToRoom(room, maxPlayers);

    this.service.startGame(room);

    await client.join(room.id);

    client.emit('game-state-update', {
      actionType: 'create-game',
      gameState: this.engine.generateGameState(room),
    });
  }

  // THIS RUNS AUTOMATICALLY WHEN CLIENT DISCONNECTS
  public handleDisconnect(@ConnectedSocket() client: Socket): void {
    this.service.destroyRoom(client.id);
  }

  @SubscribeMessage('draw-card')
  @UseFilters(WsRoomFilter, WsGameFilter)
  public drawCard(@ConnectedSocket() client: Socket): void {
    const room: GameRoom = this.service.getRoomOfPlayer(client.id)!;
    const player: Player = room.getCurrentPlayer(client.id);

    this.engine.isPlayerTurn(room, player);
    this.engine.drawCards(room, player, 1); // TRIGGERS CLEARING THE discardPile, KEEPING THE TOP CARD, PUSHING AND SHUFFLING CARDS TO drawPile WHEN drawPile is 0

    this.server.to(room.id).emit('game-state-update', {
      actionType: 'draw-cards',
      socketId: player.socketId,
      username: player.username,
      gameState: this.engine.generateGameState(room),
      cardDrew: player.getHand()[player.getHand().length - 1],
    });
  }

  @SubscribeMessage('play-cards')
  @UseFilters(WsRoomFilter, WsGameFilter)
  public async playCards(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: PlayCardsDto,
  ): Promise<void> {
    const room: GameRoom = this.service.getRoomOfPlayer(client.id)!;
    const player: Player = room.getCurrentPlayer(client.id);
    const { cardsToPlayIds, wildColor, uno }: PlayCardsDto = data;
    const playedCards: Card[] = player.getCardsToPlay(cardsToPlayIds);

    this.engine.isPlayerTurn(room, player);
    this.engine.playCards(room, player, cardsToPlayIds, wildColor);
    if (uno) player.setIsUno(true);
    this.engine.processCurrentTurn(room); // REMEMBER TO SET ISUNO = FALSE
    this.engine.processNextTurn(room);

    this.server.to(room.id).emit('game-state-update', {
      actionType: 'played-cards',
      socketId: player.socketId,
      username: player.username,
      gameState: this.engine.generateGameState(room),
      playedCards: playedCards,
    });

    await this.handleBotMoves(room, client);
  }

  public async handleBotMoves(room: GameRoom, client: Socket): Promise<void> {
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    // BOTS PLAYING
    while (true) {
      // BREAKS WHEN GAME ENDED
      if (this.engine.hasGameEnded(room)) {
        this.service.destroyRoom(client.id);
        this.server.to(room.id).emit('game-state-update', {
          actionType: 'game-ended',
          gameState: this.engine.generateGameState(room),
        });
        break;
      }

      // BREAKS WHEN ITS THE PLAYER'S TURN
      if (this.service.isBotTurn(room, client.id)) {
        const bot: Player = room.getPlayerFromOrder();

        while (
          this.engine.getPlayableCards(bot.getHand(), room.getGameBoard())
            .length === 0
        ) {
          await sleep(4000);
          this.engine.drawCards(room, bot, 1);
          this.server.to(room.id).emit('game-state-update', {
            actionType: 'draw-cards',
            socketId: bot.socketId,
            username: bot.username,
            gameState: this.engine.generateGameState(room),
            cardDrew: bot.getHand()[bot.getHand().length - 1],
          });
        }

        await sleep(5000);
        const longestPattern: Card[] = this.service.getLongestPattern(
          room,
          bot,
        );
        const cardPatternIds: string[] =
          this.service.getCardIds(longestPattern);
        bot.setIsUno(true);
        this.engine.playCards(
          room,
          bot,
          cardPatternIds,
          this.service.generateRandomWildColor(),
        );
        this.engine.processCurrentTurn(room);
        this.engine.processNextTurn(room);
        this.server.to(room.id).emit('game-state-update', {
          actionType: 'played-cards',
          socketId: bot.socketId,
          username: bot.username,
          gameState: this.engine.generateGameState(room),
          playedCards: longestPattern,
        });
      } else break;
    }
  }
}
