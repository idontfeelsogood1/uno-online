import { GameBoard, AmountGreaterThanDrawPile } from './GameBoard';
import { Card, CardColor, CardValue } from '../card/Card';

// Mock Card Data
// We cast as Card to satisfy TypeScript if the interface has more properties
const card1 = { id: '1', color: CardColor.RED, value: CardValue.ONE } as Card;
const card2 = { id: '2', color: CardColor.BLUE, value: CardValue.TWO } as Card;
const card3 = {
  id: '3',
  color: CardColor.GREEN,
  value: CardValue.THREE,
} as Card;
const card4 = {
  id: '4',
  color: CardColor.YELLOW,
  value: CardValue.FOUR,
} as Card;

describe('GameBoard', () => {
  let gameBoard: GameBoard;

  beforeEach(() => {
    gameBoard = new GameBoard('test-room-id');
  });

  it('should be defined', () => {
    expect(gameBoard).toBeDefined();
    expect(gameBoard.id).toBe('test-room-id');
  });

  describe('Discard Pile Management', () => {
    it('should push cards to discard pile', () => {
      gameBoard.pushToDiscardPile([card1, card2]);
      expect(gameBoard.getDiscardPile()).toHaveLength(2);
      expect(gameBoard.getDiscardPile()[1]).toBe(card2); // Top is last pushed
    });

    describe('clearDiscardPile', () => {
      it('should keep the top card and return the rest', () => {
        // Arrange: [card1, card2, card3] -> Top is card3
        gameBoard.pushToDiscardPile([card1, card2, card3]);

        // Act
        const cleared = gameBoard.clearDiscardPile();

        // Assert
        expect(cleared).toHaveLength(2); // card1 and card2
        expect(cleared).toContain(card1);
        expect(cleared).toContain(card2);
        expect(cleared).not.toContain(card3); // card3 should stay

        const remainingPile = gameBoard.getDiscardPile();
        expect(remainingPile).toHaveLength(1);
        expect(remainingPile[0]).toBe(card3);
      });
    });
  });

  describe('Draw Pile Management', () => {
    it('should push cards to draw pile', () => {
      gameBoard.pushToDrawPile([card1, card2]);
      expect(gameBoard.getDrawPile()).toHaveLength(2);
    });

    it('should pop specific amount from draw pile', () => {
      // Setup: Bottom [card1, card2, card3] Top
      gameBoard.pushToDrawPile([card1, card2, card3]);

      const popped = gameBoard.popFromDrawPile(2);

      // pop() takes from the end (Top)
      expect(popped).toHaveLength(2);
      expect(popped[0]).toBe(card3);
      expect(popped[1]).toBe(card2);

      expect(gameBoard.getDrawPile()).toHaveLength(1);
      expect(gameBoard.getDrawPile()[0]).toBe(card1);
    });

    it('should throw AmountGreaterThanDrawPile if requesting too many', () => {
      gameBoard.pushToDrawPile([card1]);

      expect(() => {
        gameBoard.popFromDrawPile(5);
      }).toThrow(AmountGreaterThanDrawPile);
    });

    it('should shuffle the draw pile', () => {
      const cards = [card1, card2, card3, card4];
      gameBoard.pushToDrawPile([...cards]); // Clone array to keep original ref

      gameBoard.shuffleDrawPile();

      const shuffled = gameBoard.getDrawPile();
      expect(shuffled).toHaveLength(4);
      // Check that it contains the same items, just shuffled
      expect(shuffled).toEqual(expect.arrayContaining(cards));
    });
  });

  describe('Top Card State', () => {
    it('should initialize with null top card', () => {
      const top = gameBoard.getCurrentTopCard();
      expect(top).toBeNull();
    });

    it('should set and get the current top card', () => {
      gameBoard.setCurrentTopCard(card1);
      expect(gameBoard.getCurrentTopCard()).toBe(card1);

      gameBoard.setCurrentTopCard(card2);
      expect(gameBoard.getCurrentTopCard()).toBe(card2);
    });
  });
});
