import { GameRoom } from '../game-room/GameRoom';
import { Player } from '../player/Player';
import { GameBoard } from '../game-board/GameBoard';

// Mock dependencies
const mockGameBoard = {} as GameBoard;
const player1 = { socketId: 's1', username: 'Player1' } as Player;
const player2 = { socketId: 's2', username: 'Player2' } as Player;
const player3 = { socketId: 's3', username: 'Player3' } as Player;

describe('GameRoom', () => {
  let gameRoom: GameRoom;
  const roomId = 'room-123';
  const roomName = 'Test Room';
  const ownerId = 'owner-id';
  const maxPlayers = 2;

  beforeEach(() => {
    gameRoom = new GameRoom(
      roomId,
      roomName,
      ownerId,
      maxPlayers,
      mockGameBoard,
    );
  });

  it('should be defined', () => {
    expect(gameRoom).toBeDefined();
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(gameRoom.id).toBe(roomId);
      expect(gameRoom.name).toBe(roomName);
      expect(gameRoom.getOwnerId()).toBe(ownerId);
      expect(gameRoom.maxPlayers).toBe(maxPlayers);
      expect(gameRoom.getGameBoard()).toBe(mockGameBoard);
      expect(gameRoom.hasStarted()).toBe(false);
      expect(gameRoom.getCurrentPlayers()).toEqual([]);
      expect(gameRoom.getPlayerOrder()).toEqual([]);
      expect(gameRoom.getDirection()).toBe(1);
      expect(gameRoom.getCurrentPlayerIndex()).toBe(0);
    });
  });

  describe('Game State', () => {
    it('should set and check if game has started', () => {
      gameRoom.setHasStarted(true);
      expect(gameRoom.hasStarted()).toBe(true);
    });

    it('should check if room is full', () => {
      gameRoom.addCurrentPlayer(player1);
      expect(gameRoom.isFull()).toBe(false);

      gameRoom.addCurrentPlayer(player2);
      expect(gameRoom.isFull()).toBe(true);
    });
  });

  describe('Current Players Management', () => {
    it('should add players to current players list', () => {
      gameRoom.addCurrentPlayer(player1);
      expect(gameRoom.getCurrentPlayers()).toHaveLength(1);
      expect(gameRoom.getCurrentPlayers()[0]).toBe(player1);
    });

    it('should remove a player by socket ID', () => {
      gameRoom.addCurrentPlayer(player1);
      gameRoom.addCurrentPlayer(player2);

      const removed = gameRoom.removeCurrentPlayer('s1');

      expect(removed).toBe(player1);
      expect(gameRoom.getCurrentPlayers()).toHaveLength(1);
      expect(gameRoom.getCurrentPlayers()[0]).toBe(player2);
    });

    it('should throw PlayerNotFound if player to remove does not exist', () => {
      gameRoom.addCurrentPlayer(player1);

      expect(() => {
        gameRoom.removeCurrentPlayer('s99');
      }).toThrow(); // Checking that it throws the custom error
    });
  });

  describe('Player Order Management', () => {
    it('should set and get player order', () => {
      const order = [player2, player1];
      gameRoom.setPlayerOrder(order);
      expect(gameRoom.getPlayerOrder()).toEqual(order);
    });

    it('should remove player from player order', () => {
      gameRoom.setPlayerOrder([player1, player2, player3]);

      const removed = gameRoom.removeFromPlayerOrder('s2');

      expect(removed).toBe(player2);
      expect(gameRoom.getPlayerOrder()).toHaveLength(2);
      expect(gameRoom.getPlayerOrder()).toEqual([player1, player3]);
    });

    it('should throw PlayerNotFound when removing invalid player from order', () => {
      gameRoom.setPlayerOrder([player1]);

      expect(() => {
        gameRoom.removeFromPlayerOrder('s99');
      }).toThrow();
    });
  });

  describe('Turn Logic State', () => {
    it('should set and get direction', () => {
      gameRoom.setDirection(-1);
      expect(gameRoom.getDirection()).toBe(-1);
    });

    it('should set and get current player index', () => {
      gameRoom.setCurrentPlayerIndex(2);
      expect(gameRoom.getCurrentPlayerIndex()).toBe(2);
    });

    it('should get correct player from order based on current index', () => {
      // Setup: Order is [Player2, Player1]
      // Index is 1 (which should be Player1)
      gameRoom.setPlayerOrder([player2, player1]);
      gameRoom.setCurrentPlayerIndex(1);

      const currentPlayer = gameRoom.getPlayerFromOrder();
      expect(currentPlayer).toBe(player1);
    });
  });
});
