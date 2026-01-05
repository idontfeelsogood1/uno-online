import { Injectable } from '@nestjs/common';
import { GameRoom } from './class/game-room/GameRoom';
import {
  CardPatternMismatch,
  CardTypeMismatch,
  EnforcedColorMismatch,
  GameBoard,
} from './class/game-board/GameBoard';
import { Player } from './class/player/Player';
import { PlayerNotFound } from './class/game-room/GameRoom';
import { Card, CardColor } from './class/card/Card';
import { AmountGreaterThanDrawPile } from './class/game-board/GameBoard';

@Injectable()
export class GameService {
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

  public addRoom(room: GameRoom): void {
    this.rooms.set(room.id, room);
  }

  public getRoom(roomId: string): GameRoom {
    if (this.rooms.has(roomId)) return this.rooms.get(roomId)!;

    const obj: object = Object.fromEntries(this.rooms);
    throw new RoomNotFound(
      `
      roomId: ${roomId}
      rooms: ${JSON.stringify(obj)}
      `,
      {},
    );
  }

  public getAllRoom(): GameRoom[] {
    return [...this.rooms.values()];
  }

  public removeRoom(roomId: string): GameRoom {
    if (this.rooms.has(roomId)) {
      const removedRoom: GameRoom = this.rooms.get(roomId)!;
      this.rooms.delete(roomId);
      return removedRoom;
    }

    const obj: object = Object.fromEntries(this.rooms);
    throw new RoomNotFound(
      `
      roomId: ${roomId}
      rooms: ${JSON.stringify(obj)}
      `,
      {},
    );
  }

  public createPlayer(socketId: string, username: string): Player {
    return new Player(socketId, username);
  }

  public addPlayerToRoom(roomId: string, player: Player): void {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId)!.addCurrentPlayer(player);
      return;
    }

    const obj: object = Object.fromEntries(this.rooms);
    throw new RoomNotFound(
      `
      roomId: ${roomId}
      rooms: ${JSON.stringify(obj)}
      `,
      {},
    );
  }

  public getPlayerOfRoom(
    roomId: string,
    playerSocketId: string,
  ): Player | null {
    try {
      if (!this.rooms.has(roomId)) {
        const obj: object = Object.fromEntries(this.rooms);
        throw new RoomNotFound(
          `
          roomId: ${roomId}
          rooms: ${JSON.stringify(obj)}
          `,
          {},
        );
      }
      return this.rooms.get(roomId)!.getCurrentPlayer(playerSocketId);
    } catch (err) {
      if (err instanceof RoomNotFound) throw err;
      if (err instanceof PlayerNotFound) throw err;
      return null;
    }
  }

  public removePlayerFromRoom(
    roomId: string,
    playerSocketId: string,
  ): Player | null {
    try {
      if (!this.rooms.has(roomId)) {
        const obj: object = Object.fromEntries(this.rooms);
        throw new RoomNotFound(
          `
          roomId: ${roomId}
          rooms: ${JSON.stringify(obj)}
          `,
          {},
        );
      }
      return this.rooms.get(roomId)!.removeCurrentPlayer(playerSocketId);
    } catch (err) {
      if (err instanceof RoomNotFound) throw err;
      if (err instanceof PlayerNotFound) throw err;
      return null;
    }
  }

  public getAllPlayersFromRoom(roomId: string): Player[] {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId)!.getCurrentPlayers();
    }

    const obj: object = Object.fromEntries(this.rooms);
    throw new RoomNotFound(
      `
      roomId: ${roomId}
      rooms: ${JSON.stringify(obj)}
      `,
      {},
    );
  }

  public startGame(room: GameRoom, player: Player) {
    if (player.socketId !== room.ownerId) {
      throw new NotRoomOwner(
        `
        ownerId: ${room.ownerId}
        playerId: ${player.socketId}
        `,
        {},
      );
    }

    const currentPlayers: Player[] = room.getCurrentPlayers();
    if (currentPlayers.length <= 1) {
      throw new PlayersCountMustBeGreaterThanOne(
        `
        roomPlayerCount: ${currentPlayers.length}
        `,
        {},
      );
    }

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

  public drawCards(room: GameRoom, player: Player, amount: number): void {
    const game: GameBoard = room.getGameBoard();

    try {
      player.pushToHand(game.popFromDrawPile(amount));
    } catch (err) {
      if (err instanceof AmountGreaterThanDrawPile) {
        const clearedCards: Card[] = game.clearDiscardPile();
        game.pushToDrawPile(clearedCards);
        game.shuffleDrawPile();
        throw err;
      }
    }
  }

  // COMPARE THE OFFSET OF THE PLAYER'S REAL HAND AND THE CARDS THEY WANT TO PLAY
  public uno(player: Player, cardToPlayIds: string[]): void {
    try {
      const hand: Card[] = player.getHand();
      const cardsToPlay: Card[] = player.getCardsToPlay(cardToPlayIds);
      const oneOrZeroCardRemaining: boolean =
        hand.length - cardsToPlay.length === 0 ||
        hand.length - cardsToPlay.length === 1;

      if (oneOrZeroCardRemaining) {
        player.setIsUno(true);
      } else {
        throw new CannotUno(
          `
          playerHandLength: ${hand.length}
          cardsToPlayLength: ${cardsToPlay.length}
          remainingCards (hand - CardsToPlay): ${hand.length - cardsToPlay.length}
          Must be 0 or 1
          `,
          {},
        );
      }
    } catch (err) {
      if (err instanceof CannotUno) throw err;
    }
  }

  public playCards(
    room: GameRoom,
    player: Player,
    cardToPlayIds: string[],
    wildColor?: CardColor,
  ): void {
    try {
      const game: GameBoard = room.getGameBoard();

      const cardsToPlay: Card[] = player.getCardsToPlay(cardToPlayIds);
      const cardsToPlayTopCardType: string = game.getCardType(
        cardsToPlay[cardsToPlay.length - 1],
      );
      if (cardsToPlayTopCardType === 'WILD' && wildColor) {
        game.setEnforcedColor(wildColor);
      }
      if (cardsToPlayTopCardType === 'WILD' && !wildColor) {
        throw new HaveNotChoosenColor(
          `
          topCard: ${cardsToPlay[cardsToPlay.length - 1].name}
          color: ${wildColor}
          `,
          {},
        );
      }

      game.processPattern(cardsToPlay);

      const removedCards: Card[] = player.removeCards(cardToPlayIds);
      game.pushToDiscardPile(removedCards);

      game.setTurnEvents(removedCards);
      game.setCurrentTopCard(removedCards[removedCards.length - 1]);
    } catch (err) {
      if (err instanceof HaveNotChoosenColor) throw err;
      if (err instanceof EnforcedColorMismatch) throw err;
      if (err instanceof CardTypeMismatch) throw err;
      if (err instanceof CardPatternMismatch) throw err;
    }
  }
}

export class HaveNotChoosenColor extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'HaveNotChooseColor';
  }
}

export class CannotUno extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'CannotUno';
  }
}

export class NotPlayerTurn extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'NotPlayerTurn';
  }
}

export class PlayersCountMustBeGreaterThanOne extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'PlayersCountMustBeGreaterThanOne';
  }
}

export class NotRoomOwner extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'NotRoomOwner';
  }
}

export class RoomNotFound extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'RoomNotFound';
  }
}
