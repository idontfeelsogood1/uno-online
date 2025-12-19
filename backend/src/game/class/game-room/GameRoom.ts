import { Player } from '../player/Player';
import { GameBoard } from '../game-board/GameBoard';

export class GameRoom {
  readonly id: string;
  readonly name: string;
  readonly ownerId: string;
  readonly maxPlayers: number;
  gameBoard: GameBoard;
  started: boolean;
  currentPlayers: Player[];
  playerOrder: Player[];
  direction: number;
  currentPlayerIndex: number;

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
    this.currentPlayers = [];
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
    return this.currentPlayers.length === this.maxPlayers;
  }

  public getGameBoard(): GameBoard {
    return this.gameBoard;
  }

  public addCurrentPlayer(player: Player): void {
    this.currentPlayers.push(player);
  }

  public getCurrentPlayers(): Player[] {
    return this.currentPlayers;
  }

  public removeCurrentPlayer(playerSocketId: string): Player {
    const index = this.currentPlayers.findIndex((player) => {
      return player.socketId === playerSocketId;
    });

    if (index !== -1) {
      return this.currentPlayers.splice(index, 1)[0];
    } else {
      throw new PlayerNotFound(
        `
        playerSocketId: ${playerSocketId},
        currentPlayers: ${JSON.stringify(this.currentPlayers)}
      `,
        {},
      );
    }
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
}

class PlayerNotFound extends Error {
  constructor(message: string, options: object) {
    super(message, options);
  }
}
