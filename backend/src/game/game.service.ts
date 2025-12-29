import { Injectable } from '@nestjs/common';
import { GameRoom } from './class/game-room/GameRoom';
import { GameBoard } from './class/game-board/GameBoard';
import { Player } from './class/player/Player';
import { PlayerNotFound } from './class/game-room/GameRoom';

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

    try {
      return this.rooms.get(roomId)!.getCurrentPlayer(playerSocketId);
    } catch (err) {
      if (err instanceof PlayerNotFound) throw err;
      return null;
    }
  }

  public removePlayerFromRoom(
    roomId: string,
    playerSocketId: string,
  ): Player | null {
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

    try {
      return this.rooms.get(roomId)!.removeCurrentPlayer(playerSocketId);
    } catch (err) {
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
}

export class RoomNotFound extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'RoomNotFound';
  }
}
