import { Player } from '../player/Player';
import { GameBoard } from '../game-board/GameBoard';

export class GameRoom {
  readonly id: string;
  readonly name: string;
  readonly maxPlayers: number;
  private ownerId: string;
  private gameBoard: GameBoard;
  private started: boolean;
  private currentPlayers: Map<string, Player>;
  private playerOrder: Player[];
  private direction: number;
  private currentPlayerIndex: number;

  constructor(
    id: string,
    name: string,
    ownerId: string,
    maxPlayer: number,
    gameBoard: GameBoard,
  ) {
    this.id = id;
    this.name = name;
    this.ownerId = ownerId;
    this.maxPlayers = maxPlayer;
    this.gameBoard = gameBoard;
    this.started = false;
    this.currentPlayers = new Map();
    this.playerOrder = [];
    this.direction = 1;
    this.currentPlayerIndex = 0;
  }

  public setHasStarted(started: boolean): void {
    this.started = started;
  }

  public hasStarted(): boolean {
    return this.started;
  }

  public isFull(): boolean {
    return this.currentPlayers.size === this.maxPlayers;
  }

  public getGameBoard(): GameBoard {
    return this.gameBoard;
  }

  public addCurrentPlayer(player: Player): void {
    this.currentPlayers.set(player.socketId, player);
  }

  public getCurrentPlayer(playerSocketId: string): Player {
    if (this.currentPlayers.has(playerSocketId)) {
      return this.currentPlayers.get(playerSocketId)!;
    }

    const obj: object = Object.fromEntries(this.currentPlayers);
    throw new PlayerNotFound(
      `
        playerSocketId: ${playerSocketId},
        currentPlayers: ${JSON.stringify(obj)}
        `,
      {},
    );
  }

  public getCurrentPlayers(): Player[] {
    return [...this.currentPlayers.values()];
  }

  public removeCurrentPlayer(playerSocketId: string): Player {
    if (this.currentPlayers.has(playerSocketId)) {
      const removedPlayer: Player = this.currentPlayers.get(playerSocketId)!;
      this.currentPlayers.delete(playerSocketId);
      return removedPlayer;
    }

    const obj: object = Object.fromEntries(this.currentPlayers);
    throw new PlayerNotFound(
      `
        playerSocketId: ${playerSocketId},
        currentPlayers: ${JSON.stringify(obj)}
        `,
      {},
    );
  }

  public setPlayerOrder(playerOrder: Player[]): void {
    this.playerOrder = playerOrder;
  }

  public getPlayerOrder(): Player[] {
    return this.playerOrder;
  }

  public removeFromPlayerOrder(playerSocketId: string): Player {
    const index = this.playerOrder.findIndex((player) => {
      return player.socketId === playerSocketId;
    });

    if (index !== -1) {
      return this.playerOrder.splice(index, 1)[0];
    } else {
      throw new PlayerNotFound(
        `
        playerSocketId: ${playerSocketId},
        playerOrder: ${JSON.stringify(this.playerOrder)}
      `,
        {},
      );
    }
  }

  public setDirection(direction: number): void {
    this.direction = direction;
  }

  public getDirection(): number {
    return this.direction;
  }

  public setCurrentPlayerIndex(index: number): void {
    this.currentPlayerIndex = index;
  }

  public getCurrentPlayerIndex(): number {
    return this.currentPlayerIndex;
  }

  public getOwnerId(): string {
    return this.ownerId;
  }

  public setOwnerId(ownerId: string): void {
    this.ownerId = ownerId;
  }

  public getPlayerFromOrder(): Player {
    return this.playerOrder[this.currentPlayerIndex];
  }

  public transferOwner(): Player {
    if (!this.isEmpty()) {
      const newOwnerKey: string = Array.from(this.currentPlayers.keys())[0];
      const newOwner: Player = this.currentPlayers.get(newOwnerKey)!;
      this.setOwnerId(newOwner.socketId);
      return newOwner;
    }
    throw new RoomIsEmpty(
      `
      currentPlayers size: ${this.currentPlayers.size}
      `,
      {},
    );
  }

  public isEmpty(): boolean {
    return this.currentPlayers.size === 0;
  }

  public isOwnerExists(): boolean {
    return this.currentPlayers.has(this.getOwnerId());
  }
}

export class RoomIsEmpty extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'RoomIsEmpty';
  }
}

export class PlayerNotFound extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'PlayerNotFound';
  }
}
