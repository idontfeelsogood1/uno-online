import { Test, TestingModule } from '@nestjs/testing';
import {
  GameService,
  RoomNotFound,
  NotRoomOwner,
  PlayersCountMustBeGreaterThanOne,
  NotPlayerTurn,
  CannotUno,
  HaveNotChoosenColor,
  RoomIsFull,
  RoomHasStarted,
  PlayerNotInAnyRoom,
  PlayerIsInARoom,
  RemovedOrTransfered,
  RoomHasNotStarted,
  CardsSentMustNotBeEmpty,
} from './game.service';
import { CardPatternMismatch, TurnEvents } from './class/game-board/GameBoard';
import { GameRoom, PlayerNotFound } from './class/game-room/GameRoom';
import { Player } from './class/player/Player';
import { GameBoard } from './class/game-board/GameBoard';
import { Card, CardColor, CardValue } from './class/card/Card';

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
      expect(players![0]).toBe(player);
    });

    it('should throw RoomNotFound when adding player to invalid room', () => {
      expect(() => {
        service.addPlayerToRoom('invalid-room', player);
      }).toThrow(RoomNotFound);
    });

    it('should throw RoomIsFull when adding player to a full room', () => {
      expect(() => {
        const newRoom = service.createRoom('room-2', 'Test Room', 'owner', 0);
        service.addRoom(newRoom);
        const newPlayer = service.createPlayer('socket-2', 'User2');
        service.addPlayerToRoom(newRoom.id, newPlayer);
      }).toThrow(RoomIsFull);
    });

    it('should throw RoomHasStarted when adding player to a started room', () => {
      expect(() => {
        const newRoom = service.createRoom('room-2', 'Test Room', 'owner', 4);
        newRoom.setHasStarted(true);
        service.addRoom(newRoom);
        const newPlayer = service.createPlayer('socket-2', 'User2');
        service.addPlayerToRoom(newRoom.id, newPlayer);
      }).toThrow(RoomHasStarted);
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

      const removed = service.removePlayerFromRoom(room, playerSocketId);
      expect(removed).toBe(player);
      expect(service.getAllPlayersFromRoom(roomId)).toHaveLength(0);
    });

    it('should throw PlayerNotFound when removing non-existent player', () => {
      expect(() => {
        service.removePlayerFromRoom(room, 'invalid-socket');
      }).toThrow(PlayerNotFound);
    });
  });

  // ==========================================
  // PLAYER LOCATION TRACKING
  // ==========================================
  describe('Player Location Tracking', () => {
    const roomId = 'room-1';
    let room: GameRoom;
    const playerSocketId = 'socket-1';

    beforeEach(() => {
      room = service.createRoom(roomId, 'Test Room', 'owner', 4);
      service.addRoom(room);
    });

    it('should map a player to a room and retrieve it', () => {
      service.setPlayerOfRoom(playerSocketId, roomId);

      const retrievedRoom = service.getRoomOfPlayer(playerSocketId);
      expect(retrievedRoom).toBeInstanceOf(GameRoom);
      expect((retrievedRoom as GameRoom).id).toBe(roomId);
    });

    it('should throw RoomNotFound when setting player to non-existent room', () => {
      expect(() => {
        service.setPlayerOfRoom(playerSocketId, 'invalid-room');
      }).toThrow(RoomNotFound);
    });

    it('should throw PlayerNotInAnyRoom when getting room of untracked player', () => {
      expect(() => {
        service.getRoomOfPlayer('untracked-socket');
      }).toThrow(PlayerNotInAnyRoom);
    });

    it('should throw PlayerIsInARoom when getting room of tracked player', () => {
      expect(() => {
        service.setPlayerOfRoom(playerSocketId, roomId);
        service.isPlayerInAnyRoom(playerSocketId);
      }).toThrow(PlayerIsInARoom);
    });
  });

  // ==========================================
  // ROOM CLEANUP & OWNERSHIP TRANSFER LOGIC (NEW)
  // ==========================================
  describe('Room Cleanup and Ownership Transfer', () => {
    let room: GameRoom;
    let owner: Player;
    let player2: Player;

    beforeEach(() => {
      owner = service.createPlayer('owner-1', 'Owner');
      room = service.createRoom('room-1', 'Test Room', owner.socketId, 4);
      service.addRoom(room);
      service.addPlayerToRoom(room.id, owner);
    });

    it('should remove the room if it becomes empty', () => {
      // Setup: Remove the only player (owner)
      service.removePlayerFromRoom(room, owner.socketId);

      const result = service.transferOwnerOrRemoveRoomOnEmpty(room);

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(RemovedOrTransfered);
      // Room was empty, so removedRoom should be set
      expect(result?.removedRoom).toBeDefined();
      expect(result?.removedRoom?.id).toBe(room.id);
      expect(result?.transferedOwner).toBeNull();

      // Verify room is actually removed from service
      expect(() => service.getRoom(room.id)).toThrow(RoomNotFound);
    });

    it('should transfer ownership if owner leaves but room is not empty', () => {
      // Setup: Add player 2
      player2 = service.createPlayer('player-2', 'Player 2');
      service.addPlayerToRoom(room.id, player2);

      // Remove owner
      service.removePlayerFromRoom(room, owner.socketId);

      // Call transfer logic
      const result = service.transferOwnerOrRemoveRoomOnEmpty(room);

      expect(result).toBeDefined();
      expect(result?.removedRoom).toBeNull();
      // Owner should be transferred to the next player (player2)
      expect(result?.transferedOwner).toBeDefined();
      expect(result?.transferedOwner?.socketId).toBe(player2.socketId);

      // Verify room still exists and has new owner
      const updatedRoom = service.getRoom(room.id);
      expect(updatedRoom.getOwnerId()).toBe(player2.socketId);
    });

    it('should do nothing if room is not empty and owner is still present', () => {
      player2 = service.createPlayer('player-2', 'Player 2');
      service.addPlayerToRoom(room.id, player2);

      // Remove player 2 (not owner)
      service.removePlayerFromRoom(room, player2.socketId);

      const result = service.transferOwnerOrRemoveRoomOnEmpty(room);

      expect(result?.removedRoom).toBeNull();
      expect(result?.transferedOwner).toBeNull();

      // Verify owner is still original
      expect(room.getOwnerId()).toBe(owner.socketId);
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

    it('should throw RoomHasStarted if owner tries to restart', () => {
      room.setHasStarted(true);
      expect(room.hasStarted()).toBe(true);
      expect(() => {
        service.startGame(room, owner);
      }).toThrow(RoomHasStarted);
    });

    it('should throw PlayersCountMustBeGreaterThanOne if only 1 player is in room', () => {
      // Remove player 2 to simulate solo lobby
      service.removePlayerFromRoom(room, player2.socketId);

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
  // TURN VALIDATION LOGIC
  // ==========================================
  describe('Turn Validation Logic', () => {
    let room: GameRoom;
    let owner: Player;
    let player2: Player;

    beforeEach(() => {
      owner = service.createPlayer('owner-socket', 'Owner');
      player2 = service.createPlayer('p2-socket', 'Player 2');
      room = service.createRoom('room-1', 'Test Room', owner.socketId, 4);
      service.addRoom(room);
      service.addPlayerToRoom(room.id, owner);
      service.addPlayerToRoom(room.id, player2);
      service.startGame(room, owner);
    });

    it('should return true if it is the player turn', () => {
      const currentPlayer = room.getPlayerFromOrder();
      expect(service.isPlayerTurn(room, currentPlayer)).toBe(true);
    });

    it('should throw NotPlayerTurn if it is not the player turn', () => {
      const currentPlayer = room.getPlayerFromOrder();
      const notCurrentPlayer =
        currentPlayer.socketId === owner.socketId ? player2 : owner;
      expect(() => service.isPlayerTurn(room, notCurrentPlayer)).toThrow(
        NotPlayerTurn,
      );
    });
  });

  // ==========================================
  // DRAW CARDS LOGIC
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
      service.drawCards(room, currentPlayer, 1);
      expect(clearDiscardSpy).toHaveBeenCalled();
      expect(pushDrawSpy).toHaveBeenCalled();
      expect(shuffleSpy).toHaveBeenCalled();
    });
  });

  // ==========================================
  // UNO LOGIC
  // ==========================================
  describe('Uno Logic', () => {
    let room: GameRoom;
    let owner: Player;
    let player2: Player;
    let gameBoard: GameBoard;

    beforeEach(() => {
      owner = service.createPlayer('owner-socket', 'Owner');
      player2 = service.createPlayer('p2-socket', 'Player 2');
      room = service.createRoom('room-1', 'Test Room', owner.socketId, 4);
      service.addRoom(room);
      service.addPlayerToRoom(room.id, owner);
      service.addPlayerToRoom(room.id, player2);

      service.startGame(room, owner);
      gameBoard = room.getGameBoard();
    });

    it('should set isUno to true when playing a card will leave 1 card remaining', () => {
      const currentPlayer = room.getPlayerFromOrder();

      // Manipulate hand to have exactly 2 cards
      const hand = currentPlayer.getHand();
      while (hand.length > 0) hand.pop(); // Clear hand
      const cards = gameBoard.generateUnoDeck();

      const cardToKeep = cards[0];
      const cardToPlay = cards[1];

      hand.push(cardToKeep);
      hand.push(cardToPlay);

      // Call Uno with the ID of the card we intend to play
      service.uno(currentPlayer, [cardToPlay.id]);

      expect(currentPlayer.isUno()).toBe(true);
    });

    it('should set isUno to true when playing final card leaves 0 remaining (winning move)', () => {
      const currentPlayer = room.getPlayerFromOrder();

      // Manipulate hand to have exactly 1 card (the one we are about to play)
      const hand = currentPlayer.getHand();
      while (hand.length > 0) hand.pop();
      const cards = gameBoard.generateUnoDeck();
      const cardToPlay = cards[0];
      hand.push(cardToPlay);

      // Call Uno with the ID of the card we intend to play
      service.uno(currentPlayer, [cardToPlay.id]);

      expect(currentPlayer.isUno()).toBe(true);
    });

    it('should throw CardsSentMustNotBeEmpty when sending an empty hand', () => {
      const currentPlayer = room.getPlayerFromOrder();
      expect(() => {
        service.uno(currentPlayer, []);
      }).toThrow(CardsSentMustNotBeEmpty);
    });

    it('should throw CannotUno if calculating the move leaves > 1 card', () => {
      const currentPlayer = room.getPlayerFromOrder();
      // StartGame gives 7 cards. Playing 1 leaves 6. 6 > 1.

      const cardToPlay = currentPlayer.getHand()[0];

      expect(() => {
        service.uno(currentPlayer, [cardToPlay.id]);
      }).toThrow(CannotUno);
    });
  });

  // ==========================================
  // PLAY CARDS LOGIC
  // ==========================================
  describe('Play Cards Logic', () => {
    let room: GameRoom;
    let owner: Player;
    let player2: Player;
    let gameBoard: GameBoard;

    beforeEach(() => {
      owner = service.createPlayer('owner-socket', 'Owner');
      player2 = service.createPlayer('p2-socket', 'Player 2');
      room = service.createRoom('room-1', 'Test Room', owner.socketId, 4);
      service.addRoom(room);
      service.addPlayerToRoom(room.id, owner);
      service.addPlayerToRoom(room.id, player2);

      service.startGame(room, owner);
      gameBoard = room.getGameBoard();
    });

    it('should successfully play a valid card', () => {
      const currentPlayer = room.getPlayerFromOrder();
      const topCard = gameBoard.getCurrentTopCard();

      // Construct a card that matches the topCard
      const validCard = new Card(
        'valid-card-id',
        topCard.name,
        topCard.color,
        topCard.value,
      );

      currentPlayer.pushToHand([validCard]);
      const initialHandSize = currentPlayer.getHand().length;

      service.playCards(room, currentPlayer, [validCard.id]);

      expect(currentPlayer.getHand()).toHaveLength(initialHandSize - 1);
      expect(gameBoard.getCurrentTopCard().id).toBe(validCard.id);
      expect(gameBoard.getDiscardPile()).toContain(validCard);
    });

    it('should throw CardsSentMustNotBeEmpty when sending an empty hand', () => {
      const currentPlayer = room.getPlayerFromOrder();
      expect(() => {
        service.playCards(room, currentPlayer, []);
      }).toThrow(CardsSentMustNotBeEmpty);
    });

    it('should propagate CardPatternMismatch from GameBoard if move is invalid', () => {
      const currentPlayer = room.getPlayerFromOrder();
      const topCard = gameBoard.getCurrentTopCard();

      // Create an Invalid Card
      const invalidColor =
        topCard.color === CardColor.RED ? CardColor.BLUE : CardColor.RED;
      const invalidValue =
        topCard.value === CardValue.ONE ? CardValue.TWO : CardValue.ONE;

      const invalidCard = new Card(
        'invalid-card',
        'Invalid Card',
        invalidColor,
        invalidValue,
      );

      currentPlayer.pushToHand([invalidCard]);

      expect(() => {
        service.playCards(room, currentPlayer, [invalidCard.id]);
      }).toThrow(CardPatternMismatch);
    });

    // --- NEW WILD CARD TESTS ---

    it('should successfully play a Wild card with a selected color', () => {
      const currentPlayer = room.getPlayerFromOrder();

      const wildCard = new Card(
        'wild-card-id',
        'Wild',
        CardColor.BLACK,
        CardValue.WILD,
      );

      currentPlayer.pushToHand([wildCard]);

      service.playCards(room, currentPlayer, [wildCard.id], CardColor.BLUE);

      expect(gameBoard.getEnforcedColor()).toBe(CardColor.BLUE);
      expect(gameBoard.getCurrentTopCard().id).toBe(wildCard.id);
    });

    it('should throw HaveNotChoosenColor if Wild card played without color', () => {
      const currentPlayer = room.getPlayerFromOrder();

      const wildCard = new Card(
        'wild-card-id',
        'Wild',
        CardColor.BLACK,
        CardValue.WILD,
      );

      currentPlayer.pushToHand([wildCard]);

      expect(() => {
        service.playCards(room, currentPlayer, [wildCard.id]);
      }).toThrow(HaveNotChoosenColor);
    });
  });

  // ==========================================
  // PROCESS CURRENT TURN LOGIC
  // ==========================================
  describe('Process Current Turn Logic', () => {
    let room: GameRoom;
    let owner: Player;
    let player2: Player;
    let gameBoard: GameBoard;

    beforeEach(() => {
      owner = service.createPlayer('owner-socket', 'Owner');
      player2 = service.createPlayer('p2-socket', 'Player 2');
      room = service.createRoom('room-1', 'Test Room', owner.socketId, 4);
      service.addRoom(room);
      service.addPlayerToRoom(room.id, owner);
      service.addPlayerToRoom(room.id, player2);
      service.startGame(room, owner);
      gameBoard = room.getGameBoard();
    });

    it('should penalize player (draw 2) if they have 0 card left and did not call Uno', () => {
      const currentPlayer = room.getPlayerFromOrder();

      // Setup: 1 card, isUno = false
      const hand = currentPlayer.getHand();
      while (hand.length > 0) hand.pop();
      currentPlayer.setIsUno(false);

      const drawSpy = jest.spyOn(service, 'drawCards');

      service.processCurrentTurn(room);

      expect(drawSpy).toHaveBeenCalledWith(room, currentPlayer, 2);
    });

    it('should penalize player (draw 2) if they have 1 card left and did not call Uno', () => {
      const currentPlayer = room.getPlayerFromOrder();

      // Setup: 1 card, isUno = false
      const hand = currentPlayer.getHand();
      while (hand.length > 0) hand.pop();
      hand.push(gameBoard.generateUnoDeck()[0]);
      currentPlayer.setIsUno(false);

      const drawSpy = jest.spyOn(service, 'drawCards');

      service.processCurrentTurn(room);

      expect(drawSpy).toHaveBeenCalledWith(room, currentPlayer, 2);
    });

    it('should do nothing if player has > 1 cards', () => {
      const currentPlayer = room.getPlayerFromOrder();
      // Default hand is 7 cards
      currentPlayer.setIsUno(false);

      const drawSpy = jest.spyOn(service, 'drawCards');

      service.processCurrentTurn(room);

      expect(drawSpy).not.toHaveBeenCalled();
    });

    it('should do nothing if player has 1 card but called Uno', () => {
      const currentPlayer = room.getPlayerFromOrder();

      // Setup: 1 card, isUno = true
      const hand = currentPlayer.getHand();
      while (hand.length > 0) hand.pop();
      hand.push(gameBoard.generateUnoDeck()[0]);
      currentPlayer.setIsUno(true);

      const drawSpy = jest.spyOn(service, 'drawCards');

      service.processCurrentTurn(room);

      expect(drawSpy).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // DIRECTION UPDATE LOGIC
  // ==========================================
  describe('Update Direction Logic', () => {
    let room: GameRoom;
    let owner: Player;
    let gameBoard: GameBoard;
    let player2: Player;

    beforeEach(() => {
      owner = service.createPlayer('owner-socket', 'Owner');
      player2 = service.createPlayer('player2-socket', 'Player 2');
      room = service.createRoom('room-1', 'Test Room', owner.socketId, 4);
      service.addRoom(room);
      service.addPlayerToRoom(room.id, owner);
      service.addPlayerToRoom(room.id, player2);
      service.startGame(room, owner);
      gameBoard = room.getGameBoard();
    });

    it('should flip direction from 1 to -1 when reverse_amount is 1', () => {
      room.setDirection(1);
      // Mock getTurnEvents to return reverse_amount = 1
      jest.spyOn(gameBoard, 'getTurnEvents').mockReturnValue({
        reverse_amount: 1,
      } as TurnEvents);

      service.updateDirection(room);
      expect(room.getDirection()).toBe(-1);
    });

    it('should flip direction from -1 to 1 when reverse_amount is 1', () => {
      room.setDirection(-1);
      jest.spyOn(gameBoard, 'getTurnEvents').mockReturnValue({
        reverse_amount: 1,
      } as TurnEvents);

      service.updateDirection(room);
      expect(room.getDirection()).toBe(1);
    });

    it('should keep direction same when reverse_amount is 2 (double flip)', () => {
      room.setDirection(1);
      jest.spyOn(gameBoard, 'getTurnEvents').mockReturnValue({
        reverse_amount: 2,
      } as TurnEvents);

      service.updateDirection(room);
      expect(room.getDirection()).toBe(1);
    });

    it('should do nothing when reverse_amount is 0', () => {
      room.setDirection(1);
      jest.spyOn(gameBoard, 'getTurnEvents').mockReturnValue({
        reverse_amount: 0,
      } as TurnEvents);

      service.updateDirection(room);
      expect(room.getDirection()).toBe(1);
    });
  });

  // ==========================================
  // PLAYER INDEX UPDATE LOGIC
  // ==========================================
  describe('Update Current Player Index Logic', () => {
    let room: GameRoom;
    let gameBoard: GameBoard;

    beforeEach(() => {
      const owner = service.createPlayer('p1', 'P1');
      room = service.createRoom('room-1', 'Test', owner.socketId, 4);
      service.addRoom(room);

      // Add 3 more players
      const p2 = service.createPlayer('p2', 'P2');
      const p3 = service.createPlayer('p3', 'P3');
      const p4 = service.createPlayer('p4', 'P4');

      service.addPlayerToRoom(room.id, owner);
      service.addPlayerToRoom(room.id, p2);
      service.addPlayerToRoom(room.id, p3);
      service.addPlayerToRoom(room.id, p4);

      // Start game to set order
      service.startGame(room, owner);
      gameBoard = room.getGameBoard();
    });

    it('should move to next player (index + 1) when direction is 1 (move 1 step)', () => {
      room.setDirection(1);
      room.setCurrentPlayerIndex(0); // P1

      jest.spyOn(gameBoard, 'getTurnEvents').mockReturnValue({
        skip_amount: 0, // 0 skips + 1 default = 1 step
      } as TurnEvents);

      service.updateCurrentPlayerIndex(room);

      expect(room.getCurrentPlayerIndex()).toBe(1); // P2
    });

    it('should wrap around to 0 when at last player and moving right (move 1 step)', () => {
      room.setDirection(1);
      room.setCurrentPlayerIndex(3); // P4 (last)

      jest.spyOn(gameBoard, 'getTurnEvents').mockReturnValue({
        skip_amount: 0,
      } as TurnEvents);

      service.updateCurrentPlayerIndex(room);

      expect(room.getCurrentPlayerIndex()).toBe(0); // P1
    });

    it('should move to previous player (index - 1) when direction is -1 (move 1 step)', () => {
      room.setDirection(-1);
      room.setCurrentPlayerIndex(2); // P3

      jest.spyOn(gameBoard, 'getTurnEvents').mockReturnValue({
        skip_amount: 0,
      } as TurnEvents);

      service.updateCurrentPlayerIndex(room);

      expect(room.getCurrentPlayerIndex()).toBe(1); // P2
    });

    it('should wrap around to last player when at first player and moving left (move 1 step)', () => {
      room.setDirection(-1);
      room.setCurrentPlayerIndex(0); // P1

      jest.spyOn(gameBoard, 'getTurnEvents').mockReturnValue({
        skip_amount: 0,
      } as TurnEvents);

      service.updateCurrentPlayerIndex(room);

      expect(room.getCurrentPlayerIndex()).toBe(3); // P4
    });

    it('should skip a player (move 2 steps)', () => {
      room.setDirection(1);
      room.setCurrentPlayerIndex(0); // P1

      // 1 skip card = 1 loop + 1 default = 2 steps
      jest.spyOn(gameBoard, 'getTurnEvents').mockReturnValue({
        skip_amount: 1,
      } as TurnEvents);

      service.updateCurrentPlayerIndex(room);

      expect(room.getCurrentPlayerIndex()).toBe(2); // P3
    });

    it('should skip 2 players (move 3 steps)', () => {
      room.setDirection(1);
      room.setCurrentPlayerIndex(0); // P1

      // 2 skip cards = 2 loops + 1 default = 3 steps
      jest.spyOn(gameBoard, 'getTurnEvents').mockReturnValue({
        skip_amount: 2,
      } as TurnEvents);

      service.updateCurrentPlayerIndex(room);

      expect(room.getCurrentPlayerIndex()).toBe(3); // P4
    });

    it('should skip a player while wrapping around to index 0 (move 2 steps, right)', () => {
      room.setDirection(1);
      room.setCurrentPlayerIndex(2); // P3

      jest.spyOn(gameBoard, 'getTurnEvents').mockReturnValue({
        skip_amount: 1,
      } as TurnEvents);

      service.updateCurrentPlayerIndex(room);

      expect(room.getCurrentPlayerIndex()).toBe(0); // P1
    });

    it('should skip a player while wrapping around to index 3 (move 2 steps, left)', () => {
      room.setDirection(-1);
      room.setCurrentPlayerIndex(1); // P2

      jest.spyOn(gameBoard, 'getTurnEvents').mockReturnValue({
        skip_amount: 1,
      } as TurnEvents);

      service.updateCurrentPlayerIndex(room);

      expect(room.getCurrentPlayerIndex()).toBe(3); // P4
    });
  });

  // ==========================================
  // PROCESS NEXT TURN LOGIC (NEW)
  // ==========================================
  describe('Process Next Turn Logic', () => {
    let room: GameRoom;
    let gameBoard: GameBoard;
    let owner: Player;

    beforeEach(() => {
      owner = service.createPlayer('owner', 'Owner');
      room = service.createRoom('room-1', 'Test', owner.socketId, 4);
      service.addRoom(room);

      // Add other players to total 4
      const p2 = service.createPlayer('p2', 'P2');
      const p3 = service.createPlayer('p3', 'P3');
      const p4 = service.createPlayer('p4', 'P4');
      service.addPlayerToRoom(room.id, owner);
      service.addPlayerToRoom(room.id, p2);
      service.addPlayerToRoom(room.id, p3);
      service.addPlayerToRoom(room.id, p4);

      service.startGame(room, owner);
      gameBoard = room.getGameBoard();
    });

    it('should update direction and player index', () => {
      // Mock TurnEvents to be standard
      jest.spyOn(gameBoard, 'getTurnEvents').mockReturnValue({
        reverse_amount: 0,
        skip_amount: 0,
        draw_two_amount: 0,
        wild_draw_four_amount: 0,
      } as TurnEvents);

      const directionSpy = jest.spyOn(service, 'updateDirection');
      const indexSpy = jest.spyOn(service, 'updateCurrentPlayerIndex');

      service.processNextTurn(room);

      expect(directionSpy).toHaveBeenCalledWith(room);
      expect(indexSpy).toHaveBeenCalledWith(room);
    });

    it('should make next player draw 2 cards if draw_two_amount is 1', () => {
      // Setup turn events
      jest.spyOn(gameBoard, 'getTurnEvents').mockReturnValue({
        reverse_amount: 0,
        skip_amount: 0,
        draw_two_amount: 1,
        wild_draw_four_amount: 0,
      } as TurnEvents);

      // Current player is index 0. Next should be index 1.
      room.setCurrentPlayerIndex(0);
      const nextPlayer = room.getPlayerOrder()[1];
      const initialHand = nextPlayer.getHand().length;

      service.processNextTurn(room);

      // Should have advanced
      expect(room.getCurrentPlayerIndex()).toBe(1);
      // Hand should have increased by 2
      expect(nextPlayer.getHand()).toHaveLength(initialHand + 2);
    });

    it('should make next player draw 4 cards if wild_draw_four_amount is 1', () => {
      // Setup turn events
      jest.spyOn(gameBoard, 'getTurnEvents').mockReturnValue({
        reverse_amount: 0,
        skip_amount: 0,
        draw_two_amount: 0,
        wild_draw_four_amount: 1,
      } as TurnEvents);

      room.setCurrentPlayerIndex(0);
      const nextPlayer = room.getPlayerOrder()[1];
      const initialHand = nextPlayer.getHand().length;

      service.processNextTurn(room);

      expect(room.getCurrentPlayerIndex()).toBe(1);
      expect(nextPlayer.getHand()).toHaveLength(initialHand + 4);
    });

    it('should stack draws correctly (e.g. 2 * draw_two_amount)', () => {
      jest.spyOn(gameBoard, 'getTurnEvents').mockReturnValue({
        reverse_amount: 0,
        skip_amount: 0,
        draw_two_amount: 2, // Stacked twice
        wild_draw_four_amount: 0,
      } as TurnEvents);

      room.setCurrentPlayerIndex(0);
      const nextPlayer = room.getPlayerOrder()[1];
      const initialHand = nextPlayer.getHand().length;

      service.processNextTurn(room);

      expect(nextPlayer.getHand()).toHaveLength(initialHand + 4); // 2 * 2 = 4
    });
  });

  // ==========================================
  // HELPER METHODS (NEW)
  // ==========================================
  describe('Helper Methods', () => {
    let room: GameRoom;
    let owner: Player;
    let player1: Player;

    beforeEach(() => {
      owner = service.createPlayer('owner', 'Owner');
      player1 = service.createPlayer('player-1', 'Player 1');
      room = service.createRoom('room-1', 'Test', owner.socketId, 4);
      service.addRoom(room);
      service.addPlayerToRoom(room.id, owner);
      service.addPlayerToRoom(room.id, player1);
    });

    it('should throw RoomHasNotStarted if checking status on unstarted room', () => {
      expect(room.hasStarted()).toBe(false);
      expect(() => {
        service.hasRoomNotStarted(room);
      }).toThrow(RoomHasNotStarted);
    });

    it('should allow pushing cards back to draw pile', () => {
      // Start the game
      service.startGame(room, owner);
      const gameBoard = room.getGameBoard();
      const initialDrawSize = gameBoard.getDrawPile().length;

      // Players start with 7 cards by default
      service.pushCardBackToDrawPile(room, owner);

      expect(gameBoard.getDrawPile().length).toBe(initialDrawSize + 7);
    });
  });

  // ==========================================
  // TURN ORDER ADJUSTMENT (DISCONNECT LOGIC)
  // ==========================================
  describe('Turn Order Adjustment (Disconnect Logic)', () => {
    let room: GameRoom;
    let p1: Player, p2: Player, p3: Player;

    beforeEach(() => {
      p1 = service.createPlayer('p1', 'P1');
      p2 = service.createPlayer('p2', 'P2');
      p3 = service.createPlayer('p3', 'P3');

      room = service.createRoom('room-1', 'Test', p1.socketId, 3);
      service.addRoom(room);

      service.addPlayerToRoom(room.id, p1);
      service.addPlayerToRoom(room.id, p2);
      service.addPlayerToRoom(room.id, p3);

      service.startGame(room, p1); // Order: [p1, p2, p3]
    });

    it('should keep index when the player infront of current player in order leaves (non-active turn)', () => {
      // Setup: P2 (index 1) is current player
      room.setCurrentPlayerIndex(1);

      // P3 (index 2) leaves. He is "after" P2.
      const index: number = service.getIndexFromOrder(room, p3)!;
      service.removePlayerFromRoomPlayerOrder(room, p3.socketId);
      service.setNewCurrentPlayerIndex(room, index);

      // Still P2
      expect(room.getCurrentPlayerIndex()).toBe(1);
      expect(room.getPlayerFromOrder()).toBe(p2);
    });

    it('should adjust index when a player in order behind current player leaves (non-active turn)', () => {
      // Setup: P2 (index 1) is current player
      room.setCurrentPlayerIndex(1);

      // P1 (index 0) leaves.
      const index: number = service.getIndexFromOrder(room, p1)!;
      service.removePlayerFromRoomPlayerOrder(room, p1.socketId);
      service.setNewCurrentPlayerIndex(room, index);

      // Still P2 (which is now index 0)
      expect(room.getCurrentPlayerIndex()).toBe(0);
      expect(room.getPlayerFromOrder()).toBe(p2);
    });

    it('should adjust index when a player in order behind current player leaves in longer order (non-active turn)', () => {
      const p4 = new Player('player-4', 'Player 4');
      const p5 = new Player('player-5', 'Player 5');
      room.addCurrentPlayer(p4);
      room.addCurrentPlayer(p5);
      room.setPlayerOrder([p1, p2, p3, p4, p5]);

      // Setup: P3 (index 2) is current player
      room.setCurrentPlayerIndex(2);

      // P1 (index 0) leaves.
      const index: number = service.getIndexFromOrder(room, p1)!;
      service.removePlayerFromRoomPlayerOrder(room, p1.socketId);
      service.setNewCurrentPlayerIndex(room, index);

      // Still P3 (which is now index 1)
      expect(room.getCurrentPlayerIndex()).toBe(1);
      expect(room.getPlayerFromOrder()).toBe(p3);
    });

    it('should decrement index when the current player index is out of bounds (non-active turn)', () => {
      // P3 (index 2) is current player.
      room.setCurrentPlayerIndex(2);

      // P2 (index 1) leaves. Order [P1, P3]. Length 2. MaxIndex 1.
      const index: number = service.getIndexFromOrder(room, p2)!;
      service.removePlayerFromRoomPlayerOrder(room, p2.socketId);
      service.setNewCurrentPlayerIndex(room, index);

      expect(room.getCurrentPlayerIndex()).toBe(1);
      expect(room.getPlayerFromOrder()).toBe(p3);
    });

    it('should adjust index when the current player in order leaves (direction = 1, left to right)', () => {
      // Setup: P2 (index 1) is current player
      room.setCurrentPlayerIndex(1);

      // P2 (index 1) leaves.
      const index: number = service.getIndexFromOrder(room, p2)!;
      service.removePlayerFromRoomPlayerOrder(room, p2.socketId);
      service.setNewCurrentPlayerIndex(room, index);

      expect(room.getCurrentPlayerIndex()).toBe(1);
      expect(room.getPlayerFromOrder()).toBe(p3);
    });

    it('should wrap index back to 0 when the current player at last position in order leaves (direction = 1, left to right)', () => {
      // Setup: P3 (index 2) is current player
      room.setCurrentPlayerIndex(2);

      // P3 (index 2) leaves.
      const index: number = service.getIndexFromOrder(room, p3)!;
      service.removePlayerFromRoomPlayerOrder(room, p3.socketId);
      service.setNewCurrentPlayerIndex(room, index);

      expect(room.getCurrentPlayerIndex()).toBe(0);
      expect(room.getPlayerFromOrder()).toBe(p1);
    });

    it('should decrement index when the current player in order leaves (direction = -1, right to left)', () => {
      // Setup: P2 (index 1) is current player
      room.setCurrentPlayerIndex(1);
      room.setDirection(-1);

      // P2 (index 1) leaves.
      const index: number = service.getIndexFromOrder(room, p2)!;
      service.removePlayerFromRoomPlayerOrder(room, p2.socketId);
      service.setNewCurrentPlayerIndex(room, index);

      expect(room.getCurrentPlayerIndex()).toBe(0);
      expect(room.getPlayerFromOrder()).toBe(p1);
    });

    it('should wrap index to maxIndex when the current player at starting position in order leaves (direction = -1, right to left)', () => {
      // Setup: P1 (index 0) is current player
      room.setCurrentPlayerIndex(0);
      room.setDirection(-1);

      // P1 (index 0) leaves.
      const index: number = service.getIndexFromOrder(room, p1)!;
      service.removePlayerFromRoomPlayerOrder(room, p1.socketId);
      service.setNewCurrentPlayerIndex(room, index);

      expect(room.getCurrentPlayerIndex()).toBe(1);
      expect(room.getPlayerFromOrder()).toBe(p3);
    });
  });

  // ==========================================
  // STATE GENERATION LOGIC (NEW)
  // ==========================================
  describe('State Generation Logic', () => {
    let room: GameRoom;
    let owner: Player;
    let player2: Player;

    beforeEach(() => {
      owner = service.createPlayer('owner-1', 'Owner');
      player2 = service.createPlayer('player-2', 'Player 2');
      room = service.createRoom('room-1', 'Test Room', owner.socketId, 4);
      service.addRoom(room);
      service.addPlayerToRoom(room.id, owner);
      service.addPlayerToRoom(room.id, player2);
    });

    it('should generate correct Room State (Lobby)', () => {
      const state = service.generateRoomState(room);

      expect(state).toBeDefined();
      expect(state.roomId).toBe(room.id);
      expect(state.roomName).toBe(room.name);
      expect(state.maxPlayers).toBe(room.maxPlayers);
      expect(state.hasRoomStarted).toBe(false);
      expect(state.ownerSocketId).toBe(owner.socketId);
      expect(state.ownerUsername).toBe(owner.username);
      expect(state.currentPlayers).toHaveLength(2);
      expect(state.currentPlayers[0].username).toBe(owner.username);
      expect(state.currentPlayers[1].username).toBe(player2.username);
    });

    it('should generate correct Lobby State (List of Rooms)', () => {
      const room2 = service.createRoom('room-2', 'Room 2', player2.socketId, 2);
      room2.addCurrentPlayer(player2);
      service.addRoom(room2);

      const lobbyState = service.generateLobbyState();

      expect(lobbyState).toHaveLength(2);
      expect(lobbyState[0].roomId).toBe(room.id);
      expect(lobbyState[1].roomId).toBe(room2.id);
    });

    it('should generate correct Game State', () => {
      service.startGame(room, owner);

      const gameState = service.generateGameState(room);

      expect(gameState).toBeDefined();
      expect(gameState.currentPlayerIndex).toBe(room.getCurrentPlayerIndex());
      expect(gameState.direction).toBe(room.getDirection());
      expect(gameState.topCard).toBeDefined();
      expect(gameState.topCard.id).toBe(
        room.getGameBoard().getCurrentTopCard().id,
      );

      expect(gameState.playerOrder).toHaveLength(2);
      // Check if hands are being sent
      expect(
        gameState.playerOrder[room.getCurrentPlayerIndex()].hand,
      ).toHaveLength(7);
      expect(gameState.playerOrder[room.getCurrentPlayerIndex()].username).toBe(
        owner.username,
      );
    });
  });

  // ==========================================
  // GAME END & RESET LOGIC (NEW)
  // ==========================================
  describe('Game End & Reset Logic', () => {
    let room: GameRoom;
    let owner: Player;
    let player2: Player;

    beforeEach(() => {
      owner = service.createPlayer('owner-1', 'Owner');
      player2 = service.createPlayer('player-2', 'Player 2');
      room = service.createRoom('room-1', 'Test Room', owner.socketId, 4);
      service.addRoom(room);
      service.addPlayerToRoom(room.id, owner);
      service.setPlayerOfRoom(owner.socketId, room.id);
      service.addPlayerToRoom(room.id, player2);
      service.setPlayerOfRoom(player2.socketId, room.id);
    });

    it('should identify when game has ended (1 player left)', () => {
      service.startGame(room, owner);

      // Simulate player2 leaving during game
      service.removePlayerFromRoomPlayerOrder(room, player2.socketId);

      expect(service.hasGameEnded(room)).toBe(true);
    });

    it('should identify when game has NOT ended (>1 player left)', () => {
      service.startGame(room, owner);
      expect(service.hasGameEnded(room)).toBe(false);
    });

    it('should reset the room correctly', () => {
      service.startGame(room, owner);
      const originalRoomId = room.id;

      service.resetRoom(room);

      const newRoom = service.getRoom(originalRoomId);

      // Should be a new instance
      expect(newRoom).not.toBe(room);
      // Should have same properties
      expect(newRoom.id).toBe(originalRoomId);
      expect(newRoom.getOwnerId()).toBe(owner.socketId);
      // Should be reset
      expect(newRoom.hasStarted()).toBe(false);
      expect(newRoom.getGameBoard()).toBeDefined();

      // Players should be re-added
      expect(newRoom.getCurrentPlayers()).toHaveLength(2);
      expect(service.getRoomOfPlayer(owner.socketId)).toBe(newRoom);
      expect(service.getRoomOfPlayer(player2.socketId)).toBe(newRoom);
      expect(service.getPlayerOfRoom(newRoom.id, owner.socketId)).toBe(owner);
      expect(service.getPlayerOfRoom(newRoom.id, player2.socketId)).toBe(
        player2,
      );
    });
  });
});
