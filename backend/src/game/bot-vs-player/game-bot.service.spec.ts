import { Test, TestingModule } from '@nestjs/testing';
import { GameBotService } from './game-bot.service';
import { GameRoom } from '../model/game-room/GameRoom';
import { Player } from '../model/player/Player';
import { GameBoard, TurnEvents } from '../model/game-board/GameBoard';
import { Card, CardColor, CardValue } from '../model/card/Card';
import {
  RoomNotFound,
  NotPlayerTurn,
  CannotDrawCard,
  CardsSentMustNotBeEmpty,
  HaveNotChoosenColor,
} from '../service-exception/service-exception';

describe('GameBotService', () => {
  let service: GameBotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameBotService],
    }).compile();

    service = module.get<GameBotService>(GameBotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==========================================
  // ROOM & BOT MANAGEMENT
  // ==========================================
  describe('Room & Bot Management', () => {
    const roomId = 'room-1';
    const roomName = 'Bot Test Room';
    const ownerId = 'owner-socket-1';
    const maxPlayers = 4;

    it('should create a room instance', () => {
      const room = service.createRoom(roomId, roomName, ownerId, maxPlayers);
      expect(room).toBeInstanceOf(GameRoom);
      expect(room.id).toBe(roomId);
      expect(room.getGameBoard()).toBeInstanceOf(GameBoard);
    });

    it('should set a player to a room and retrieve the room', () => {
      const room = service.createRoom(roomId, roomName, ownerId, maxPlayers);
      const player = new Player(ownerId, 'Human Player');

      service.setPlayerOfRoom(room, player);

      const retrievedRoom = service.getRoomOfPlayer(ownerId);
      expect(retrievedRoom).toBe(room);
      expect(room.getCurrentPlayers()).toContain(player);
    });

    it('should throw RoomNotFound when getting room of untracked player', () => {
      expect(() => {
        service.getRoomOfPlayer('invalid-socket-id');
      }).toThrow(RoomNotFound);
    });

    it('should add the correct number of bots to the room', () => {
      const room = service.createRoom(roomId, roomName, ownerId, maxPlayers);
      const player = new Player(ownerId, 'Human Player');
      service.setPlayerOfRoom(room, player);

      service.addBotToRoom(room, maxPlayers);

      // 1 Human + 3 Bots = 4 Players total
      expect(room.getCurrentPlayers()).toHaveLength(4);
      expect(room.getCurrentPlayers()[1].username).toBe('Bot 1');
      expect(room.getCurrentPlayers()[3].username).toBe('Bot 3');
    });

    it('should destroy a room mapping successfully', () => {
      const room = service.createRoom(roomId, roomName, ownerId, maxPlayers);
      const player = new Player(ownerId, 'Human Player');
      service.setPlayerOfRoom(room, player);

      const isDestroyed = service.destroyRoom(ownerId);

      expect(isDestroyed).toBe(true);
      expect(() => service.getRoomOfPlayer(ownerId)).toThrow(RoomNotFound);
    });
  });

  // ==========================================
  // GAME INITIALIZATION & STATE
  // ==========================================
  describe('Start Game & State Generation', () => {
    let room: GameRoom;
    let owner: Player;

    beforeEach(() => {
      owner = new Player('owner-id', 'Owner');
      room = service.createRoom('room-1', 'Bot Room', owner.socketId, 4);
      service.setPlayerOfRoom(room, owner);
      service.addBotToRoom(room, 4);
    });

    it('should start the game and deal cards properly', () => {
      service.startGame(room);

      expect(room.hasStarted()).toBe(true);
      expect(room.getPlayerOrder()).toHaveLength(4);

      // Verify every player got 7 cards
      room.getPlayerOrder().forEach((player) => {
        expect(player.getHand()).toHaveLength(7);
      });

      // Verify Discard Pile has 1 card
      expect(room.getGameBoard().getDiscardPile()).toHaveLength(1);
      expect(room.getGameBoard().getCurrentTopCard()).toBeDefined();
    });

    it('should generate accurate PublicGameState', () => {
      service.startGame(room);
      const state = service.generateGameState(room);

      expect(state.currentPlayerIndex).toBe(room.getCurrentPlayerIndex());
      expect(state.direction).toBe(room.getDirection());
      expect(state.topCard).toBeDefined();
      expect(state.playerOrder).toHaveLength(4);
      expect(state.playerOrder[0].socketId).toBe(owner.socketId);
      expect(state.playerOrder[0].hand).toHaveLength(7);
    });
  });

  // ==========================================
  // TURN VALIDATION
  // ==========================================
  describe('Turn Validation Logic', () => {
    let room: GameRoom;
    let owner: Player;
    let bot: Player;

    beforeEach(() => {
      owner = new Player('owner-id', 'Owner');
      room = service.createRoom('room-1', 'Bot Room', owner.socketId, 2);
      service.setPlayerOfRoom(room, owner);
      service.addBotToRoom(room, 2);
      service.startGame(room);
      bot = room.getPlayerOrder()[1];
    });

    it('should return true if it is the players turn', () => {
      // By default, index 0 (owner) starts
      expect(service.isPlayerTurn(room, owner)).toBe(true);
    });

    it('should throw NotPlayerTurn if it is not the players turn', () => {
      expect(() => {
        service.isPlayerTurn(room, bot);
      }).toThrow(NotPlayerTurn);
    });

    it('should accurately report if it is a bots turn (not the humans)', () => {
      // Current turn is owner. So isBotTurn for human socket should be false.
      expect(service.isBotTurn(room, owner.socketId)).toBe(false);

      // Force turn to Bot
      room.setCurrentPlayerIndex(1);

      // Current turn is bot. So isBotTurn checking against human socket is true.
      expect(service.isBotTurn(room, owner.socketId)).toBe(true);
    });
  });

  // ==========================================
  // DRAW CARDS LOGIC
  // ==========================================
  describe('Draw Cards Logic', () => {
    let room: GameRoom;
    let bot: Player;
    let gameBoard: GameBoard;

    beforeEach(() => {
      const owner = new Player('owner-id', 'Owner');
      room = service.createRoom('room-1', 'Bot Room', owner.socketId, 2);
      service.setPlayerOfRoom(room, owner);
      service.addBotToRoom(room, 2);
      service.startGame(room);

      bot = room.getPlayerOrder()[1];
      gameBoard = room.getGameBoard();
    });

    it('should get playable cards from a hand', () => {
      // Mock validation to strictly control the test
      jest.spyOn(gameBoard, 'isValidFirstMove').mockImplementation((card) => {
        return card.color === CardColor.RED;
      });

      const hand = [
        new Card('1', 'Red 1', CardColor.RED, CardValue.ONE),
        new Card('2', 'Blue 2', CardColor.BLUE, CardValue.TWO),
      ];

      const playable = service.getPlayableCards(hand, gameBoard);
      expect(playable).toHaveLength(1);
      expect(playable[0].color).toBe(CardColor.RED);
    });

    it('should throw CannotDrawCard if player tries to draw but has playable cards', () => {
      // Force a playable card scenario
      jest
        .spyOn(service, 'getPlayableCards')
        .mockReturnValue([new Card('1', 'R1', CardColor.RED, CardValue.ONE)]);

      expect(() => {
        service.drawCards(room, bot, 1);
      }).toThrow(CannotDrawCard);
    });

    it('should allow draw if no playable cards exist', () => {
      // Force no playable cards
      jest.spyOn(service, 'getPlayableCards').mockReturnValue([]);
      const initialHandSize = bot.getHand().length;

      service.drawCards(room, bot, 1);

      expect(bot.getHand()).toHaveLength(initialHandSize + 1);
    });

    it('should reshuffle discard pile if draw pile runs out', () => {
      jest.spyOn(service, 'getPlayableCards').mockReturnValue([]);

      // Drain draw pile manually
      const remainingDraw = gameBoard.getDrawPile().length;
      gameBoard.popFromDrawPile(remainingDraw);

      const clearDiscardSpy = jest.spyOn(gameBoard, 'clearDiscardPile');
      const pushDrawSpy = jest.spyOn(gameBoard, 'pushToDrawPile');

      service.drawCards(room, bot, 1);

      expect(clearDiscardSpy).toHaveBeenCalled();
      expect(pushDrawSpy).toHaveBeenCalled();
    });
  });

  // ==========================================
  // PLAY CARDS LOGIC
  // ==========================================
  describe('Play Cards Logic', () => {
    let room: GameRoom;
    let bot: Player;
    let gameBoard: GameBoard;

    beforeEach(() => {
      const owner = new Player('owner-id', 'Owner');
      room = service.createRoom('room-1', 'Bot Room', owner.socketId, 2);
      service.setPlayerOfRoom(room, owner);
      service.addBotToRoom(room, 2);
      service.startGame(room);

      bot = room.getPlayerOrder()[1];
      gameBoard = room.getGameBoard();
    });

    it('should throw CardsSentMustNotBeEmpty if passing empty array', () => {
      expect(() => {
        service.playCards(room, bot, []);
      }).toThrow(CardsSentMustNotBeEmpty);
    });

    it('should successfully play a valid card', () => {
      const validCard = new Card(
        'valid-1',
        'Red 1',
        CardColor.RED,
        CardValue.ONE,
      );
      bot.pushToHand([validCard]);

      // Mock validation to bypass GameBoard complex logic
      jest.spyOn(gameBoard, 'processPattern').mockImplementation(() => true);
      jest.spyOn(gameBoard, 'getCardType').mockReturnValue('NUMBER');

      const initialHandSize = bot.getHand().length;

      service.playCards(room, bot, [validCard.id]);

      expect(bot.getHand()).toHaveLength(initialHandSize - 1);
      expect(gameBoard.getDiscardPile()).toContain(validCard);
      expect(gameBoard.getCurrentTopCard().id).toBe(validCard.id);
    });

    it('should play a Wild card and enforce the chosen color', () => {
      const wildCard = new Card(
        'wild-1',
        'Wild',
        CardColor.BLACK,
        CardValue.WILD,
      );
      bot.pushToHand([wildCard]);

      jest.spyOn(gameBoard, 'processPattern').mockImplementation(() => true);
      jest.spyOn(gameBoard, 'getCardType').mockReturnValue('WILD');

      service.playCards(room, bot, [wildCard.id], CardColor.BLUE);

      expect(gameBoard.getEnforcedColor()).toBe(CardColor.BLUE);
      expect(gameBoard.getCurrentTopCard().id).toBe(wildCard.id);
    });

    it('should throw HaveNotChoosenColor if Wild is played without color', () => {
      const wildCard = new Card(
        'wild-1',
        'Wild',
        CardColor.BLACK,
        CardValue.WILD,
      );
      bot.pushToHand([wildCard]);

      jest.spyOn(gameBoard, 'processPattern').mockImplementation(() => true);
      jest.spyOn(gameBoard, 'getCardType').mockReturnValue('WILD');

      expect(() => {
        service.playCards(room, bot, [wildCard.id]);
      }).toThrow(HaveNotChoosenColor);
    });
  });

  // ==========================================
  // PROCESS TURNS & INDEX MANAGEMENT
  // ==========================================
  describe('Turn Processing & Index Management', () => {
    let room: GameRoom;
    let owner: Player;
    let bot1: Player;
    let gameBoard: GameBoard;

    beforeEach(() => {
      owner = new Player('owner-id', 'Owner');
      room = service.createRoom('room-1', 'Bot Room', owner.socketId, 3);
      service.setPlayerOfRoom(room, owner);
      service.addBotToRoom(room, 3);
      service.startGame(room);

      bot1 = room.getPlayerOrder()[1];
      gameBoard = room.getGameBoard();
    });

    it('processCurrentTurn: should draw 2 penalty if player has 1 card but forgot Uno', () => {
      // Empty hand, give 1 card, set Uno false
      while (owner.getHand().length > 0) owner.getHand().pop();
      owner.pushToHand([new Card('1', 'R1', CardColor.RED, CardValue.ONE)]);
      owner.setIsUno(false);

      const drawSpy = jest.spyOn(service, 'drawCards').mockImplementation();

      service.processCurrentTurn(room);

      expect(drawSpy).toHaveBeenCalledWith(room, owner, 2);
    });

    it('processCurrentTurn: should remove player and return true if hand is 0 and they called Uno (Win)', () => {
      // Empty hand, set Uno true
      while (owner.getHand().length > 0) owner.getHand().pop();
      owner.setIsUno(true);
      room.setCurrentPlayerIndex(0);

      const didWin = service.processCurrentTurn(room);

      expect(didWin).toBe(true);
      // Owner should be removed from order
      expect(room.getPlayerOrder()).toHaveLength(2);
    });

    it('processNextTurn: should apply draw_two_amount to the next player', () => {
      jest.spyOn(gameBoard, 'getTurnEvents').mockReturnValue({
        reverse_amount: 0,
        skip_amount: 0,
        draw_two_amount: 1,
        wild_draw_four_amount: 0,
      } as TurnEvents);

      room.setCurrentPlayerIndex(0); // Owner
      const drawSpy = jest.spyOn(service, 'drawCards').mockImplementation();

      service.processNextTurn(room);

      expect(room.getCurrentPlayerIndex()).toBe(1); // Moved to bot1
      expect(drawSpy).toHaveBeenCalledWith(room, bot1, 2); // 1 * 2
    });

    it('setNewCurrentPlayerIndex: should safely handle player removal index shifting', () => {
      room.setCurrentPlayerIndex(1); // Bot 1's turn
      room.setDirection(1); // Moving forward

      // If Owner (index 0) is removed, current player (Bot 1, index 1) should shift down to index 0
      service.setNewCurrentPlayerIndex(room, 0);

      expect(room.getCurrentPlayerIndex()).toBe(0);
    });
  });

  // ==========================================
  // BOT AI HELPERS & DFS LOGIC
  // ==========================================
  describe('Bot AI Helpers', () => {
    it('should map an array of Cards to an array of Card IDs', () => {
      const cards = [
        new Card('id-1', 'Red 1', CardColor.RED, CardValue.ONE),
        new Card('id-2', 'Blue 2', CardColor.BLUE, CardValue.TWO),
      ];

      const ids = service.getCardIds(cards);

      expect(ids).toHaveLength(2);
      expect(ids).toEqual(['id-1', 'id-2']);
    });

    it('should generate a valid, random, non-black wild color', () => {
      const color = service.generateRandomWildColor();

      expect(color).not.toBe(CardColor.BLACK);
      expect([
        CardColor.RED,
        CardColor.BLUE,
        CardColor.GREEN,
        CardColor.YELLOW,
      ]).toContain(color);
    });
  });

  describe('DFS Logic: getLongestPattern', () => {
    let room: GameRoom;
    let bot: Player;
    let gameBoard: GameBoard;

    beforeEach(() => {
      const owner = new Player('owner', 'Owner');
      room = service.createRoom('room-1', 'Bot Room', owner.socketId, 2);
      service.setPlayerOfRoom(room, owner);
      service.addBotToRoom(room, 2);
      bot = room.getPlayerOrder()[1] || new Player('bot-1', 'Bot 1');
      gameBoard = room.getGameBoard();
    });

    it('should find the mathematically longest valid chain of cards using DFS', () => {
      // 1. Setup the Bot's Hand
      const cardA = new Card('a', 'Red 1', CardColor.RED, CardValue.ONE);
      const cardB = new Card('b', 'Red 2', CardColor.RED, CardValue.TWO);
      const cardC = new Card('c', 'Blue 2', CardColor.BLUE, CardValue.TWO);
      const cardD = new Card('d', 'Blue 5', CardColor.BLUE, CardValue.FIVE);
      gameBoard.setCurrentTopCard(
        new Card('zero', 'Red 0', CardColor.RED, CardValue.ZERO),
      );

      bot.pushToHand([cardA, cardB, cardC, cardD]);

      // 3. Execute the DFS
      const longestPattern = service.getLongestPattern(room, bot);

      expect(longestPattern).toBeDefined();
      expect(longestPattern).toHaveLength(3);
    });
  });
});
