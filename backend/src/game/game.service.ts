import { Injectable } from '@nestjs/common';
import { GameRoom, RoomIsEmpty } from './class/game-room/GameRoom';
import {
  CardPatternMismatch,
  CardTypeMismatch,
  EnforcedColorMismatch,
  GameBoard,
  TurnEvents,
} from './class/game-board/GameBoard';
import { Player } from './class/player/Player';
import { PlayerNotFound } from './class/game-room/GameRoom';
import { Card, CardColor } from './class/card/Card';
import { AmountGreaterThanDrawPile } from './class/game-board/GameBoard';

@Injectable()
export class GameService {
  private rooms: Map<string, GameRoom>;
  private players: Map<string, GameRoom>;

  constructor() {
    this.rooms = new Map();
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

  public transferOwnerOrRemoveRoomOnEmpty(
    room: GameRoom,
  ): RemovedOrTransfered | void {
    try {
      let transferedOwner: Player | null = null;
      let removedRoom: GameRoom | null = null;

      if (room.isEmpty()) {
        removedRoom = this.removeRoom(room.id);
      }
      if (!room.isEmpty() && !room.isOwnerExists()) {
        transferedOwner = room.transferOwner();
      }

      return new RemovedOrTransfered(transferedOwner, removedRoom);
    } catch (err) {
      if (err instanceof RoomNotFound) throw err;
      if (err instanceof RoomIsEmpty) throw err;
    }
  }

  public setPlayerOfRoom(playerSocketId: string, roomId: string): void {
    try {
      const room: GameRoom = this.getRoom(roomId);
      this.players.set(playerSocketId, room);
    } catch (err) {
      if (err instanceof RoomNotFound) throw err;
    }
  }

  // IF THE CURRENT PLAYER IS IN A ROOM, IT WILL RETURN THE ROOM THEY'RE IN
  public getRoomOfPlayer(playerSocketId: string): GameRoom | void {
    try {
      if (!this.players.has(playerSocketId)) {
        const obj: object = Object.fromEntries(this.players);
        throw new PlayerNotInAnyRoom(
          `
          players, rooms: ${JSON.stringify(obj)}
          `,
          {},
        );
      }
      return this.players.get(playerSocketId)!;
    } catch (err) {
      if (err instanceof PlayerNotInAnyRoom) throw err;
    }
  }

  public removeRoomOfPlayer(playerSocketId: string): GameRoom | void {
    try {
      const room: GameRoom = this.getRoomOfPlayer(playerSocketId)!;
      this.players.delete(playerSocketId);
      return room;
    } catch (err) {
      if (err instanceof PlayerNotInAnyRoom) throw err;
    }
  }

  public isPlayerInAnyRoom(playerSocketId: string): void {
    try {
      const room: GameRoom = this.getRoomOfPlayer(playerSocketId)!;
      throw new PlayerIsInARoom(
        `
        Player is in room: ${room.name} --- ${room.id}
        `,
        {},
      );
    } catch (err) {
      if (err instanceof PlayerNotInAnyRoom) return;
      if (err instanceof PlayerIsInARoom) throw err;
    }
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
    try {
      const room: GameRoom = this.getRoom(roomId);
      if (room.isFull()) {
        throw new RoomIsFull(
          `
          maxPlayerSize: ${room.maxPlayers}
          roomSize: ${room.getCurrentPlayers().length}
          `,
          {},
        );
      }

      this.hasRoomStarted(room);

      room.addCurrentPlayer(player);
    } catch (err) {
      if (err instanceof RoomNotFound) throw err;
      if (err instanceof RoomIsFull) throw err;
      if (err instanceof RoomHasStarted) throw err;
    }
  }

  public getPlayerOfRoom(
    roomId: string,
    playerSocketId: string,
  ): Player | void {
    try {
      const room: GameRoom = this.getRoom(roomId);
      return room.getCurrentPlayer(playerSocketId);
    } catch (err) {
      if (err instanceof RoomNotFound) throw err;
      if (err instanceof PlayerNotFound) throw err;
    }
  }

  public removePlayerFromRoom(
    room: GameRoom,
    playerSocketId: string,
  ): Player | void {
    try {
      return room.removeCurrentPlayer(playerSocketId);
    } catch (err) {
      if (err instanceof PlayerNotFound) throw err;
    }
  }

  public removePlayerFromRoomPlayerOrder(
    room: GameRoom,
    playerSocketId: string,
  ): Player | void {
    try {
      room.removeFromPlayerOrder(playerSocketId);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      return;
    }
  }

  public getAllPlayersFromRoom(roomId: string): Player[] | void {
    try {
      const room: GameRoom = this.getRoom(roomId);
      return room.getCurrentPlayers();
    } catch (err) {
      if (err instanceof RoomNotFound) throw err;
    }
  }

  public startGame(room: GameRoom, player: Player) {
    try {
      this.hasRoomStarted(room);

      if (player.socketId !== room.getOwnerId()) {
        throw new NotRoomOwner(
          `
          ownerId: ${room.getOwnerId()}
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
    } catch (err) {
      if (err instanceof RoomHasStarted) throw err;
      if (err instanceof NotRoomOwner) throw err;
      if (err instanceof PlayersCountMustBeGreaterThanOne) throw err;
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

  public hasRoomStarted(room: GameRoom): void {
    if (room.hasStarted()) {
      throw new RoomHasStarted(
        `
        roomId: ${room.id}
        roomName: ${room.name}
        `,
        {},
      );
    }
  }

  public hasRoomNotStarted(room: GameRoom): void {
    if (!room.hasStarted()) {
      throw new RoomHasNotStarted(
        `
        roomId: ${room.id}
        roomName: ${room.name}
        `,
        {},
      );
    }
  }

  // ONLY WORKS WHEN PREVIOUS PLAYER IS REMOVED FIRST AND ITS THEIR TURN
  public setNewCurrentPlayerIndex(
    room: GameRoom,
    removedPlayerIndex: number,
  ): void {
    const direction: number = room.getDirection();
    const maxIndex: number = room.getPlayerOrder().length - 1;
    let currentIndex: number = room.getCurrentPlayerIndex();

    if (removedPlayerIndex === currentIndex) {
      // KEEP currentIndex WHEN ARRAY SPLICE AND INDEX IS NOT OUT OF BOUND
      // RESET TO 0 IF OUT OF BOUND
      if (direction === 1 && currentIndex > maxIndex) {
        currentIndex = 0;
      }

      // DECREMENT currentIndex BY DEFAULT WHEN ARRAY SPLICE
      // SET currentIndex = maxIndex WHEN ITS OUT OF BOUND
      if (direction === -1 && currentIndex <= 0) {
        currentIndex = maxIndex;
      } else if (direction === -1) currentIndex--;

      // SHIFT THE INDEX IF THE REMOVED PLAYER IS BEHIND THE CURRENT PLAYER
    } else if (removedPlayerIndex < currentIndex) {
      currentIndex--;
    }

    room.setCurrentPlayerIndex(currentIndex);
  }

  public pushCardBackToDrawPile(room: GameRoom, player: Player): void {
    const game: GameBoard = room.getGameBoard();
    game.pushToDrawPile(player.getHand());
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

  // **************************
  // CALL THESE AFTER playCards
  // **************************

  public processCurrentTurn(room: GameRoom): void {
    try {
      const currentPlayer: Player = room.getPlayerFromOrder();
      const hand: Card[] = currentPlayer.getHand();
      const zeroOrOneCardLeftOnHand = hand.length === 0 || hand.length === 1;

      if (zeroOrOneCardLeftOnHand && currentPlayer.isUno() === false) {
        this.drawCards(room, currentPlayer, 2);
      }
      if (hand.length === 0 && currentPlayer.isUno() === true) {
        throw new PlayerWon(
          `
          playerSocketId: ${currentPlayer.socketId}
          username: ${currentPlayer.username}
          `,
          {},
        );
      }
    } catch (err) {
      if (err instanceof AmountGreaterThanDrawPile) throw err;
      if (err instanceof PlayerWon) throw err;
    }
  }

  public updateDirection(room: GameRoom): void {
    let direction: number = room.getDirection();
    let { reverse_amount }: TurnEvents = room.getGameBoard().getTurnEvents();

    while (reverse_amount) {
      if (direction === 1) direction = -1;
      else if (direction === -1) direction = 1;
      reverse_amount--;
    }

    room.setDirection(direction);
  }

  public updateCurrentPlayerIndex(room: GameRoom): void {
    let currentIndex: number = room.getCurrentPlayerIndex();
    let { skip_amount }: TurnEvents = room.getGameBoard().getTurnEvents();
    const direction: number = room.getDirection();
    const playerOrder: Player[] = room.getPlayerOrder();

    while (skip_amount) {
      if (direction === 1) {
        if (currentIndex === playerOrder.length - 1) currentIndex = 0;
        else currentIndex++;
      }
      if (direction === -1) {
        if (currentIndex === 0) currentIndex = playerOrder.length - 1;
        else currentIndex--;
      }
      skip_amount--;
    }

    // UPDATE THE INDEX BY DEFAULT (FOR NON-SKIP AND SKIPS)
    if (direction === 1) {
      if (currentIndex === playerOrder.length - 1) currentIndex = 0;
      else currentIndex++;
    }
    if (direction === -1) {
      if (currentIndex === 0) currentIndex = playerOrder.length - 1;
      else currentIndex--;
    }

    room.setCurrentPlayerIndex(currentIndex);
  }

  public processNextTurn(room: GameRoom): void {
    this.updateDirection(room);
    this.updateCurrentPlayerIndex(room);
    const nextPlayer: Player = room.getPlayerFromOrder();
    const game: GameBoard = room.getGameBoard();
    const { draw_two_amount, wild_draw_four_amount }: TurnEvents =
      game.getTurnEvents();

    try {
      if (draw_two_amount) {
        this.drawCards(room, nextPlayer, draw_two_amount * 2);
      }
      if (wild_draw_four_amount) {
        this.drawCards(room, nextPlayer, wild_draw_four_amount * 4);
      }
    } catch (err) {
      if (err instanceof AmountGreaterThanDrawPile) throw err;
    }
  }
}

export class RoomHasNotStarted extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'RoomHasNotStarted';
  }
}

export class RemovedOrTransfered {
  readonly transferedOwner: Player | null;
  readonly removedRoom: GameRoom | null;
  constructor(transferedOwner: Player | null, removedRoom: GameRoom | null) {
    this.transferedOwner = transferedOwner;
    this.removedRoom = removedRoom;
  }
}

export class PlayerIsInARoom extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'PlayerIsInARoom';
  }
}

export class PlayerNotInAnyRoom extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'PlayerNotInAnyRoom';
  }
}

export class RoomHasStarted extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'RoomHasStarted';
  }
}

export class RoomIsFull extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'RoomIsFull';
  }
}

export class PlayerWon extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'PlayerWon';
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
