import { Injectable } from '@nestjs/common';
import { GameRoom, RoomIsEmpty } from '../model/game-room/GameRoom';
import { GameBoard } from '../model/game-board/GameBoard';
import { Player } from '../model/player/Player';
import { PlayerNotFound } from '../model/game-room/GameRoom';
import { Card } from '../model/card/Card';
import {
  RoomHasNotStarted,
  RemovedOrTransfered,
  PlayerNotInAnyRoom,
  PlayerIsInARoom,
  RoomIsFull,
  PlayersCountMustBeGreaterThanOne,
  NotRoomOwner,
  RoomNotFound,
  RoomHasStarted,
} from '../service-exception/service-exception';

import {
  PublicRoomPlayer,
  PublicRoomState,
} from '../service-interface/service-interface';

@Injectable()
export class GamePlayerService {
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

  public getIndexFromOrder(room: GameRoom, player: Player): number | null {
    const playerOrder: Player[] = room.getPlayerOrder();
    for (let i = 0; i < playerOrder.length; i++) {
      if (player.socketId === playerOrder[i].socketId) {
        return i;
      }
    }
    return null;
  }

  public pushCardBackToDrawPile(room: GameRoom, player: Player): void {
    const game: GameBoard = room.getGameBoard();
    game.pushToDrawPile(player.getHand());
  }

  public resetRoom(room: GameRoom): void {
    const prevRoomCurrentPlayer: Player[] = room.getCurrentPlayers();
    const newPlayer: Player[] = [];

    for (const player of prevRoomCurrentPlayer) {
      this.removeRoomOfPlayer(player.socketId);
      newPlayer.push(new Player(player.socketId, player.username));
    }
    this.removeRoom(room.id);

    const newRoom: GameRoom = this.createRoom(
      room.id,
      room.name,
      room.getOwnerId(),
      room.maxPlayers,
    );

    this.addRoom(newRoom);

    for (const player of newPlayer) {
      this.addPlayerToRoom(newRoom.id, player);
      this.setPlayerOfRoom(player.socketId, newRoom.id);
    }
  }

  public generateLobbyState(): PublicRoomState[] {
    const res: PublicRoomState[] = [];
    for (const room of this.getAllRoom()) {
      res.push(this.generateRoomState(room));
    }
    return res;
  }

  public generateRoomState(room: GameRoom): PublicRoomState {
    return new PublicRoomState(
      room.id,
      room.name,
      room.maxPlayers,
      room.hasStarted(),
      room.getOwnerId(),
      room.getCurrentPlayer(room.getOwnerId()).username,
      this.generatePublicRoomPlayers(room),
    );
  }

  public generatePublicRoomPlayers(room: GameRoom): PublicRoomPlayer[] {
    const currentPlayers: Player[] = room.getCurrentPlayers();
    const publicRoomPlayers: PublicRoomPlayer[] = [];

    for (const player of currentPlayers) {
      publicRoomPlayers.push(
        new PublicRoomPlayer(player.socketId, player.username),
      );
    }

    return publicRoomPlayers;
  }
}
