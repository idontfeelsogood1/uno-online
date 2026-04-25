import { Injectable } from '@nestjs/common';
import { Player } from '../class/player/Player';
import { GameRoom } from '../class/game-room/GameRoom';
import { GameBoard } from '../class/game-board/GameBoard';
import { randomUUID } from 'crypto';
import { Card } from '../class/card/Card';
import {
  PublicGameState,
  PublicGamePlayer,
  RoomNotFound,
  NotPlayerTurn,
} from '../player-vs-player/game.service';
import { AmountGreaterThanDrawPile } from '../class/game-board/GameBoard';

@Injectable()
export class GameBotService {
  private rooms: Map<string, GameRoom>;

  constructor() {
    this.rooms = new Map();
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
    this.rooms.set(room.id, room);
    this.rooms.set(player.socketId, room);
    this.rooms.get(player.socketId)!.addCurrentPlayer(player);
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

  public destroyRoom(socketId: string): boolean {
    return this.rooms.delete(socketId);
  }

  public getRoomOfPlayer(socketId: string): GameRoom | void {
    const room: GameRoom | undefined = this.rooms.get(socketId);

    if (room) return room;
    else {
      const obj: object = Object.fromEntries(this.rooms);
      throw new RoomNotFound(
        `
        socketId: ${socketId}
        rooms: ${JSON.stringify(obj)}
      `,
        {},
      );
    }
  }

  public isPlayerTurn(room: GameRoom, player: Player): boolean {
    const currentPlayer: Player = room.getPlayerFromOrder();

    if (player.socketId !== currentPlayer.socketId) {
      throw new NotPlayerTurn(
        `
          playerId: ${player.socketId}
          currentPlayerTurnId: ${currentPlayer.socketId}
          `,
        {},
      );
    }

    return true;
  }

  public getPlayableCards(hand: Card[], game: GameBoard): Card[] {
    const playableCards: Card[] = [];

    for (const card of hand) {
      if (game.isValidFirstMove(card)) playableCards.push(card);
    }

    return playableCards;
  }

  public drawCards(room: GameRoom, player: Player, amount: number): void {
    const game: GameBoard = room.getGameBoard();
    const playableCards: Card[] = this.getPlayableCards(player.getHand(), game);

    if (playableCards.length === 0) {
      throw new CannotDrawCard(
        `
        Player have a playable card in hand!
        `,
        { cause: playableCards },
      );
    }

    try {
      player.pushToHand(game.popFromDrawPile(amount));
    } catch (err) {
      if (err instanceof AmountGreaterThanDrawPile) {
        const clearedCards: Card[] = game.clearDiscardPile();
        game.pushToDrawPile(clearedCards);
        game.shuffleDrawPile();
      }
    }
  }
}

export class CannotDrawCard extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'CannotDrawCard';
  }
}
