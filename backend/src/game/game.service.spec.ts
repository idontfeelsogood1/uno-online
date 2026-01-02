import { Test, TestingModule } from '@nestjs/testing';
import {
  GameService,
  RoomNotFound,
  NotRoomOwner,
  PlayersCountMustBeGreaterThanOne,
  NotPlayerTurn,
} from './game.service';
import { AmountGreaterThanDrawPile } from './class/game-board/GameBoard';
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

  // ==========================================
  // START GAME LOGIC
  // ==========================================
  describe('Start Game Logic', () => {
    let room: GameRoom;
    let owner: Player;
    let player2: Player;

    beforeEach(() => {
      // Setup: Create Room with Owner
      owner = service.createPlayer('owner-socket', 'Owner');
      room = service.createRoom('room-1', 'Test Room', owner.socketId, 4);
      service.addRoom(room);
      service.addPlayerToRoom(room.id, owner);

      // Add second player
      player2 = service.createPlayer('p2-socket', 'Player 2');
      service.addPlayerToRoom(room.id, player2);
    });

    it('should start the game successfully when conditions are met', () => {
      service.startGame(room, owner);

      expect(room.hasStarted()).toBe(true);

      // Verify Player Order was set
      expect(room.getPlayerOrder()).toHaveLength(2);
      expect(room.getPlayerOrder()).toContain(owner);
      expect(room.getPlayerOrder()).toContain(player2);

      // Verify Cards were dealt (7 cards each)
      expect(owner.getHand()).toHaveLength(7);
      expect(player2.getHand()).toHaveLength(7);

      // Verify GameBoard State
      const gameBoard = room.getGameBoard();
      expect(gameBoard.getDiscardPile().length).toBeGreaterThan(0); // Should have 1 top card
      expect(gameBoard.getCurrentTopCard()).toBeDefined();
    });

    it('should throw NotRoomOwner if non-owner tries to start', () => {
      expect(() => {
        service.startGame(room, player2);
      }).toThrow(NotRoomOwner);
      expect(room.hasStarted()).toBe(false);
    });

    it('should throw PlayersCountMustBeGreaterThanOne if only 1 player is in room', () => {
      // Remove player 2 to simulate solo lobby
      service.removePlayerFromRoom(room.id, player2.socketId);

      expect(() => {
        service.startGame(room, owner);
      }).toThrow(PlayersCountMustBeGreaterThanOne);
      expect(room.hasStarted()).toBe(false);
    });

    it('should shuffle the deck and start discard pile', () => {
      const gameBoard = room.getGameBoard();

      // Spy on GameBoard methods to ensure they are called
      const shuffleSpy = jest.spyOn(gameBoard, 'shuffleDrawPile');
      const discardSpy = jest.spyOn(gameBoard, 'startDiscardPile');

      service.startGame(room, owner);

      expect(shuffleSpy).toHaveBeenCalled();
      expect(discardSpy).toHaveBeenCalled();
    });
  });

  // ==========================================
  // DRAW CARDS LOGIC (NEW)
  // ==========================================
  describe('Draw Cards Logic', () => {
    let room: GameRoom;
    let owner: Player;
    let player2: Player;
    let gameBoard: GameBoard;

    beforeEach(() => {
      // Setup and Start a Game
      owner = service.createPlayer('owner-socket', 'Owner');
      player2 = service.createPlayer('p2-socket', 'Player 2');
      room = service.createRoom('room-1', 'Test Room', owner.socketId, 4);
      service.addRoom(room);
      service.addPlayerToRoom(room.id, owner);
      service.addPlayerToRoom(room.id, player2);

      service.startGame(room, owner);
      gameBoard = room.getGameBoard();
    });

    it('should allow the current player to draw cards', () => {
      const currentPlayer = room.getPlayerFromOrder();
      const initialHandSize = currentPlayer.getHand().length;

      service.drawCards(room, currentPlayer, 1);

      expect(currentPlayer.getHand()).toHaveLength(initialHandSize + 1);
    });

    it('should throw NotPlayerTurn if a non-current player tries to draw', () => {
      const currentPlayer = room.getPlayerFromOrder();
      const notCurrentPlayer =
        currentPlayer.socketId === owner.socketId ? player2 : owner;

      expect(() => {
        service.drawCards(room, notCurrentPlayer, 1);
      }).toThrow(NotPlayerTurn);
    });

    it('should reshuffle discard pile if draw pile runs out', () => {
      const currentPlayer = room.getPlayerFromOrder();

      // Simulate a nearly empty/drained draw pile
      // 1. Drain the draw pile manually
      const remainingDraw = gameBoard.getDrawPile().length;
      gameBoard.popFromDrawPile(remainingDraw);

      // 2. Spy on the reshuffle methods
      const clearDiscardSpy = jest.spyOn(gameBoard, 'clearDiscardPile');
      const pushDrawSpy = jest.spyOn(gameBoard, 'pushToDrawPile');
      const shuffleSpy = jest.spyOn(gameBoard, 'shuffleDrawPile');

      // 3. Attempt to draw (Logic: tries pop -> fails -> catch -> reshuffle)
      expect(() => {
        service.drawCards(room, currentPlayer, 1);
      }).toThrow(AmountGreaterThanDrawPile);
      expect(clearDiscardSpy).toHaveBeenCalled();
      expect(pushDrawSpy).toHaveBeenCalled();
      expect(shuffleSpy).toHaveBeenCalled();
    });
  });
});
