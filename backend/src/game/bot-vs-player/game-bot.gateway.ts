import 'dotenv/config';
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Player } from '../class/player/Player';
import { GameRoom } from '../class/game-room/GameRoom';
import { GameBotService } from './game-bot.service';
import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { CreateGameDto } from '../dto/create-game.dto';
import { randomUUID } from 'crypto';
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsValidationFilter } from '../filter/ws-validation.filter';

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
export class GameBotGateway {
  server!: Server;

  constructor(private readonly service: GameBotService) {}

  @SubscribeMessage('create-game')
  public async createGame(
    @MessageBody() data: CreateGameDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { maxPlayers }: CreateGameDto = data;

    const playerSocketId: string = client.id;
    const owner: Player = new Player(playerSocketId, 'Player');

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
      gameState: this.service.generateGameState(room),
    });
  }
}
