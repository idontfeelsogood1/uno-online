import { Test, TestingModule } from '@nestjs/testing';
import { GameService, RoomNotFound } from './game.service';
import { GameRoom, PlayerNotFound } from './class/game-room/GameRoom';
import { Player } from './class/player/Player';
import { GameBoard } from './class/game-board/GameBoard';

describe('GameService', () => {
  let service: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameService],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Room Management', () => {
    const roomId = 'room-1';
    const roomName = 'Test Room';
    const ownerId = 'owner-1';
    const maxPlayers = 4;

    it('should create a room instance', () => {
      const room = service.createRoom(roomId, roomName, ownerId, maxPlayers);
      expect(room).toBeInstanceOf(GameRoom);
      expect(room.id).toBe(roomId);
      // Validates GameBoard is injected automatically inside createRoom
      expect(room.getGameBoard()).toBeInstanceOf(GameBoard);
    });

    it('should add and retrieve a room', () => {
      const room = service.createRoom(roomId, roomName, ownerId, maxPlayers);
      service.addRoom(room);

      const retrieved = service.getRoom(roomId);
      expect(retrieved).toBe(room);
    });

    it('should return all rooms', () => {
      const room1 = service.createRoom('r1', 'n1', 'o1', 2);
      const room2 = service.createRoom('r2', 'n2', 'o2', 2);

      service.addRoom(room1);
      service.addRoom(room2);

      const allRooms = service.getAllRoom();
      expect(allRooms).toHaveLength(2);
      expect(allRooms).toContain(room1);
      expect(allRooms).toContain(room2);
    });

    it('should throw RoomNotFound when getting a non-existent room', () => {
      expect(() => {
        service.getRoom('invalid-id');
      }).toThrow(RoomNotFound);
    });

    it('should remove a room', () => {
      const room = service.createRoom(roomId, roomName, ownerId, maxPlayers);
      service.addRoom(room);

      const removed = service.removeRoom(roomId);
      expect(removed).toBe(room);
      expect(() => service.getRoom(roomId)).toThrow(RoomNotFound);
    });

    it('should throw RoomNotFound when removing a non-existent room', () => {
      expect(() => {
        service.removeRoom('invalid-id');
      }).toThrow(RoomNotFound);
    });
  });

  describe('Player Management', () => {
    const roomId = 'room-1';
    let room: GameRoom;
    const playerSocketId = 'socket-1';
    const username = 'User1';
    let player: Player;

    beforeEach(() => {
      room = service.createRoom(roomId, 'Test Room', 'owner', 4);
      service.addRoom(room);
      player = service.createPlayer(playerSocketId, username);
    });

    it('should create a player instance', () => {
      expect(player).toBeInstanceOf(Player);
      expect(player.socketId).toBe(playerSocketId);
      expect(player.username).toBe(username);
    });

    it('should add a player to a room', () => {
      // Adding player to the specific room ID managed by service
      expect(() => {
        service.addPlayerToRoom(roomId, player);
      }).not.toThrow();

      const players = service.getAllPlayersFromRoom(roomId);
      expect(players).toHaveLength(1);
      expect(players[0]).toBe(player);
    });

    it('should throw RoomNotFound when adding player to invalid room', () => {
      expect(() => {
        service.addPlayerToRoom('invalid-room', player);
      }).toThrow(RoomNotFound);
    });

    it('should get a specific player from a room', () => {
      service.addPlayerToRoom(roomId, player);

      const retrieved = service.getPlayerOfRoom(roomId, playerSocketId);
      expect(retrieved).toBe(player);
    });

    it('should throw PlayerNotFound if player not found in room', () => {
      // Based on your code: `if (err instanceof PlayerNotFound) throw err;`
      expect(() => {
        service.getPlayerOfRoom(roomId, 'non-existent-socket');
      }).toThrow(PlayerNotFound);
    });

    it('should throw RoomNotFound when getting player from invalid room', () => {
      expect(() => {
        service.getPlayerOfRoom('invalid-room', playerSocketId);
      }).toThrow(RoomNotFound);
    });

    it('should remove a player from a room', () => {
      service.addPlayerToRoom(roomId, player);

      const removed = service.removePlayerFromRoom(roomId, playerSocketId);
      expect(removed).toBe(player);
      expect(service.getAllPlayersFromRoom(roomId)).toHaveLength(0);
    });

    it('should throw PlayerNotFound when removing non-existent player', () => {
      expect(() => {
        service.removePlayerFromRoom(roomId, 'invalid-socket');
      }).toThrow(PlayerNotFound);
    });
  });
});
