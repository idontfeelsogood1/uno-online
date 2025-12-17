import { Player } from './Player';
import { Card } from '../card/Card';
import { CardColor } from '../card/card-color.enum';
import { CardValue } from '../card/card-value.enum';

// Mock Card class or interface if needed, or use simple objects for testing
const mockCard1 = {
  id: 'c1',
  color: CardColor.RED,
  value: CardValue.ONE,
} as Card;
const mockCard2 = {
  id: 'c2',
  color: CardColor.BLUE,
  value: CardValue.TWO,
} as Card;
const mockCard3 = {
  id: 'c3',
  color: CardColor.GREEN,
  value: CardValue.THREE,
} as Card;

describe('Player', () => {
  let player: Player;
  const socketId = 'socket-123';
  const username = 'TestPlayer';

  beforeEach(() => {
    // Reset player before each test
    player = new Player(socketId, username, [], false);
  });

  it('should be defined', () => {
    expect(player).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with correct values', () => {
      expect(player.socketId).toBe(socketId);
      expect(player.username).toBe(username);
      expect(player.getHand()).toEqual([]);
      expect(player.isUno()).toBe(false);
    });
  });

  describe('pushToHand', () => {
    it('should add cards to the hand', () => {
      player.pushToHand([mockCard1, mockCard2]);
      expect(player.getHand()).toHaveLength(2);
      expect(player.getHand()).toEqual([mockCard1, mockCard2]);
    });

    it('should append cards to an existing hand', () => {
      player.pushToHand([mockCard1]);
      player.pushToHand([mockCard2]);
      expect(player.getHand()).toHaveLength(2);
      expect(player.getHand()[1]).toEqual(mockCard2);
    });
  });

  describe('removeCards', () => {
    beforeEach(() => {
      player.pushToHand([mockCard1, mockCard2, mockCard3]);
    });

    it('should remove specific cards by ID and return them', () => {
      const removed = player.removeCards(['c1', 'c3']);

      expect(removed).toHaveLength(2);
      expect(removed).toContain(mockCard1);
      expect(removed).toContain(mockCard3);

      const hand = player.getHand();
      expect(hand).toHaveLength(1);
      expect(hand[0]).toEqual(mockCard2);
    });

    it('should handle removing non-existent cards gracefully', () => {
      const removed = player.removeCards(['c99']);
      expect(removed).toHaveLength(0);
      expect(player.getHand()).toHaveLength(3); // Hand remains unchanged
    });

    it('should correctly update the hand after removal', () => {
      player.removeCards(['c2']);
      expect(player.getHand()).toEqual([mockCard1, mockCard3]);
    });
  });

  describe('Uno Status', () => {
    it('should set and get isUno correctly', () => {
      player.setIsUno(true);
      expect(player.isUno()).toBe(true);

      player.setIsUno(false);
      expect(player.isUno()).toBe(false);
    });
  });
});
