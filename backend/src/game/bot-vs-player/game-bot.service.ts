import { Injectable } from '@nestjs/common';
import { Player } from '../class/player/Player';
import { GameRoom } from '../class/game-room/GameRoom';
import { GameBoard } from '../class/game-board/GameBoard';
import { randomUUID } from 'crypto';
import { Card } from '../class/card/Card';
import {
  PublicGameState,
  PublicGamePlayer,
} from '../player-vs-player/game.service';

@Injectable()
export class GameBotService {
  private players: Map<string, GameRoom>;

  constructor() {
    this.players = new Map();
  }

  public createRoom(
    id: string,
    name: string,
    ownerId: string,
    maxPlayer: number,
  ): GameRoom {
    return new GameRoom(id, name, ownerId, maxPlayer, new GameBoard(id));
  }

  public setPlayerOfRoom(room: GameRoom, player: Player): void {
    this.players.set(room.id, room);
    this.players.set(player.socketId, room);
    this.players.get(player.socketId)!.addCurrentPlayer(player);
  }

  public addBotToRoom(room: GameRoom, maxPlayers: number) {
    for (let i = 0; i < maxPlayers - 1; i++) {
      room.addCurrentPlayer(new Player(randomUUID(), `Bot ${i + 1}`));
    }
  }

  public startGame(room: GameRoom) {
    const currentPlayers: Player[] = room.getCurrentPlayers();
    room.setHasStarted(true);
    room.setPlayerOrder(currentPlayers);

    const game: GameBoard = room.getGameBoard();
    const cards: Card[] = game.generateUnoDeck();

    game.pushToDrawPile(cards);
    game.shuffleDrawPile();

    const playerOrder: Player[] = room.getPlayerOrder();
    playerOrder.forEach((player) => {
      player.pushToHand(game.popFromDrawPile(7));
    });

    game.startDiscardPile();
    game.setCurrentTopCard(game.getDiscardPile()[0]);
  }

  public generateGameState(room: GameRoom): PublicGameState {
    return new PublicGameState(
      room.getCurrentPlayerIndex(),
      this.generatePublicGamePlayers(room),
      room.getDirection(),
      room.getGameBoard().getCurrentTopCard(),
      room.getGameBoard().getEnforcedColor(),
    );
  }

  public generatePublicGamePlayers(room: GameRoom): PublicGamePlayer[] {
    const playerOrder: Player[] = room.getPlayerOrder();
    const publicGamePlayers: PublicGamePlayer[] = [];

    for (const player of playerOrder) {
      publicGamePlayers.push(
        new PublicGamePlayer(
          player.socketId,
          player.username,
          player.getHand(),
          player.isUno(),
        ),
      );
    }

    return publicGamePlayers;
  }
}
