import {
  GameBoard,
  AmountGreaterThanDrawPile,
  EnforcedColorMismatch,
  CardTypeMismatch,
  CardPatternMismatch,
} from './GameBoard';
import { Card, CardColor, CardValue } from '../card/Card';

// ==========================================
// EXPANDED MOCKS
// ==========================================

// Helper to create valid card mocks quickly
const createCard = (
  id: string,
  color: CardColor,
  value: CardValue,
  name: string,
): Card => {
  return { id, color, value, name } as any as Card;
};

// --- RED SUIT ---
const redOne = createCard('r1', CardColor.RED, CardValue.ONE, 'Red One');
const redTwo = createCard('r2', CardColor.RED, CardValue.TWO, 'Red Two');
const redThree = createCard('r3', CardColor.RED, CardValue.THREE, 'Red Three');
const redFour = createCard('r4', CardColor.RED, CardValue.FOUR, 'Red Four');
const redFive = createCard('r5', CardColor.RED, CardValue.FIVE, 'Red Five');
const redSkip = createCard('rs', CardColor.RED, CardValue.SKIP, 'Red Skip');
const redDrawTwo = createCard(
  'rd2',
  CardColor.RED,
  CardValue.DRAW_TWO,
  'Red Draw Two',
);
const redReverse = createCard(
  'rr',
  CardColor.RED,
  CardValue.REVERSE,
  'Red Reverse',
);

// --- BLUE SUIT ---
const blueOne = createCard('b1', CardColor.BLUE, CardValue.ONE, 'Blue One'); // Bridge from Red One
const blueThree = createCard(
  'b3',
  CardColor.BLUE,
  CardValue.THREE,
  'Blue Three',
); // Bridge from Red Three
const blueFour = createCard('b4', CardColor.BLUE, CardValue.FOUR, 'Blue Four');
const blueFive = createCard('b5', CardColor.BLUE, CardValue.FIVE, 'Blue Five');
const blueSkip = createCard('bs', CardColor.BLUE, CardValue.SKIP, 'Blue Skip');
const blueDrawTwo = createCard(
  'bd2',
  CardColor.BLUE,
  CardValue.DRAW_TWO,
  'Blue Draw Two',
);
const blueReverse = createCard(
  'br',
  CardColor.BLUE,
  CardValue.REVERSE,
  'Blue Reverse',
);

// --- GREEN SUIT ---
const greenFour = createCard(
  'g4',
  CardColor.GREEN,
  CardValue.FOUR,
  'Green Four',
); // Bridge from Blue Four
const greenFive = createCard(
  'g5',
  CardColor.GREEN,
  CardValue.FIVE,
  'Green Five',
);
const greenSix = createCard('g6', CardColor.GREEN, CardValue.SIX, 'Green Six');
const greenSkip = createCard(
  'gs',
  CardColor.GREEN,
  CardValue.SKIP,
  'Green Skip',
);
const greenDrawTwo = createCard(
  'gd2',
  CardColor.GREEN,
  CardValue.DRAW_TWO,
  'Green Draw Two',
);
const greenReverse = createCard(
  'gr',
  CardColor.GREEN,
  CardValue.REVERSE,
  'Green Reverse',
);

// --- YELLOW SUIT ---
const yellowSix = createCard(
  'y6',
  CardColor.YELLOW,
  CardValue.SIX,
  'Yellow Six',
); // Bridge from Green Six
const yellowSeven = createCard(
  'y7',
  CardColor.YELLOW,
  CardValue.SEVEN,
  'Yellow Seven',
);
const yellowSkip = createCard(
  'ys',
  CardColor.YELLOW,
  CardValue.SKIP,
  'Yellow Skip',
);
const yellowDrawTwo = createCard(
  'yd2',
  CardColor.YELLOW,
  CardValue.DRAW_TWO,
  'Yellow Draw Two',
);
const yellowReverse = createCard(
  'yr',
  CardColor.YELLOW,
  CardValue.REVERSE,
  'Yellow Reverse',
);

// --- SPECIALS ---
const wildCard1 = createCard('w1', CardColor.BLACK, CardValue.WILD, 'Wild 1');
const wildCard2 = createCard('w2', CardColor.BLACK, CardValue.WILD, 'Wild 2');
const wildCard3 = createCard('w3', CardColor.BLACK, CardValue.WILD, 'Wild 3');

const wildDrawFour1 = createCard(
  'wd4-1',
  CardColor.BLACK,
  CardValue.WILD_DRAW_FOUR,
  'Wild Draw 4 (1)',
);
const wildDrawFour2 = createCard(
  'wd4-2',
  CardColor.BLACK,
  CardValue.WILD_DRAW_FOUR,
  'Wild Draw 4 (2)',
);
const wildDrawFour3 = createCard(
  'wd4-3',
  CardColor.BLACK,
  CardValue.WILD_DRAW_FOUR,
  'Wild Draw 4 (3)',
);

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
      gameBoard.pushToDiscardPile([redOne, redTwo]);
      expect(gameBoard.getDiscardPile()).toHaveLength(2);
      expect(gameBoard.getDiscardPile()[1]).toBe(redTwo);
    });

    describe('clearDiscardPile', () => {
      it('should keep the top card and return the rest', () => {
        gameBoard.pushToDiscardPile([redOne, redTwo, redThree]);
        const cleared = gameBoard.clearDiscardPile();

        expect(cleared).toHaveLength(2);
        expect(cleared).toContain(redOne);
        expect(cleared).toContain(redTwo);
        expect(cleared).not.toContain(redThree);

        const remainingPile = gameBoard.getDiscardPile();
        expect(remainingPile).toHaveLength(1);
        expect(remainingPile[0]).toBe(redThree);
      });
    });
  });

  describe('Draw Pile Management', () => {
    it('should push cards to draw pile', () => {
      gameBoard.pushToDrawPile([redOne, redTwo]);
      expect(gameBoard.getDrawPile()).toHaveLength(2);
    });

    it('should pop specific amount from draw pile', () => {
      gameBoard.pushToDrawPile([redOne, redTwo, redThree]);
      const popped = gameBoard.popFromDrawPile(2);

      expect(popped).toHaveLength(2);
      expect(popped[0]).toBe(redThree);
      expect(popped[1]).toBe(redTwo);
      expect(gameBoard.getDrawPile()[0]).toBe(redOne);
    });

    it('should throw AmountGreaterThanDrawPile if requesting too many', () => {
      gameBoard.pushToDrawPile([redOne]);
      expect(() => {
        gameBoard.popFromDrawPile(5);
      }).toThrow(AmountGreaterThanDrawPile);
    });

    it('should shuffle the draw pile', () => {
      const cards = [redOne, redTwo, redThree, redFour];
      gameBoard.pushToDrawPile([...cards]);
      gameBoard.shuffleDrawPile();
      const shuffled = gameBoard.getDrawPile();
      expect(shuffled).toHaveLength(4);
      expect(shuffled).toEqual(expect.arrayContaining(cards));
    });
  });

  describe('Top Card & Enforced Color', () => {
    it('should manage top card state', () => {
      expect(gameBoard.getCurrentTopCard()).toBeNull();
      gameBoard.setCurrentTopCard(redOne);
      expect(gameBoard.getCurrentTopCard()).toBe(redOne);
    });

    it('should manage enforced color', () => {
      gameBoard.setEnforcedColor(CardColor.RED);
      expect(gameBoard.getEnforcedColor()).toBe(CardColor.RED);
    });
  });

  // ==========================================
  // PATTERN PROCESSING TESTS
  // ==========================================
  describe('Pattern Processing', () => {
    beforeEach(() => {
      gameBoard.setCurrentTopCard(redOne);
      gameBoard.setEnforcedColor(CardColor.RED);
    });

    describe('Basic Logic', () => {
      it('should allow simple sequential same-color run', () => {
        expect(() =>
          gameBoard.processPattern([redTwo, redThree]),
        ).not.toThrow();
      });

      it('should allow simple value match (color switch)', () => {
        expect(() => gameBoard.processPattern([blueOne])).not.toThrow();
      });

      it('should allow Wild on anything', () => {
        expect(() => gameBoard.processPattern([wildCard1])).not.toThrow();
      });
    });

    describe('Long & Complex Chains', () => {
      it('should allow a Long Sequential Run (Ladder)', () => {
        expect(() => {
          gameBoard.processPattern([redTwo, redThree, redFour, redFive]);
        }).not.toThrow();
      });

      it('should allow a "Bridge" chain (switching colors via value match)', () => {
        gameBoard.setCurrentTopCard(redThree);
        expect(() => {
          gameBoard.processPattern([blueThree, blueFour, greenFour, greenFive]);
        }).not.toThrow();
      });

      it('should allow a complex multi-bridge chain crossing 4 colors', () => {
        gameBoard.setCurrentTopCard(redFour);
        const complexChain = [
          blueFour,
          greenFour,
          greenFive,
          greenSix,
          yellowSix,
          yellowSeven,
        ];
        expect(() => {
          gameBoard.processPattern(complexChain);
        }).not.toThrow();
      });

      it('should allow stacking identical numbers', () => {
        gameBoard.setCurrentTopCard(redTwo);
        expect(() => {
          gameBoard.processPattern([redTwo, redTwo, redThree]);
        }).not.toThrow();
      });
    });

    describe('Action Card Chains', () => {
      it('should allow a long chain of SKIPS across different colors', () => {
        gameBoard.setCurrentTopCard(redSkip);
        gameBoard.setEnforcedColor(CardColor.RED);
        expect(() => {
          gameBoard.processPattern([blueSkip, greenSkip, yellowSkip, redSkip]);
        }).not.toThrow();
      });

      it('should allow a long chain of DRAW TWOS across different colors', () => {
        gameBoard.setCurrentTopCard(redDrawTwo);
        gameBoard.setEnforcedColor(CardColor.RED);
        expect(() => {
          gameBoard.processPattern([
            blueDrawTwo,
            greenDrawTwo,
            yellowDrawTwo,
            redDrawTwo,
          ]);
        }).not.toThrow();
      });

      it('should allow a long chain of REVERSES across different colors', () => {
        gameBoard.setCurrentTopCard(redReverse);
        gameBoard.setEnforcedColor(CardColor.RED);
        expect(() => {
          gameBoard.processPattern([
            blueReverse,
            greenReverse,
            yellowReverse,
            redReverse,
          ]);
        }).not.toThrow();
      });

      it('should fail if Action types are mixed in a long chain', () => {
        gameBoard.setCurrentTopCard(redSkip);
        gameBoard.setEnforcedColor(CardColor.RED);
        // Chain: Blue Skip -> Green Skip -> Yellow REVERSE (Mismatch!)
        expect(() => {
          gameBoard.processPattern([blueSkip, greenSkip, yellowReverse]);
        }).toThrow(CardPatternMismatch);
      });
    });

    describe('Wild Card Chains', () => {
      it('should allow a long chain of identical Wild cards', () => {
        expect(() => {
          gameBoard.processPattern([wildCard1, wildCard2, wildCard3]);
        }).not.toThrow();
      });

      it('should allow a long chain of identical Wild Draw Four cards', () => {
        expect(() => {
          gameBoard.processPattern([
            wildDrawFour1,
            wildDrawFour2,
            wildDrawFour3,
          ]);
        }).not.toThrow();
      });

      it('should fail if a long chain of Wilds switches type at the end', () => {
        expect(() => {
          gameBoard.processPattern([wildCard1, wildCard2, wildDrawFour1]);
        }).toThrow(CardPatternMismatch);
      });

      it('should NOT allow mixing different Wild types (Wild -> WD4)', () => {
        expect(() => {
          gameBoard.processPattern([wildCard1, wildDrawFour1]);
        }).toThrow(CardPatternMismatch);
      });

      it('should allow chaining Wilds after a normal card', () => {
        expect(() => {
          gameBoard.processPattern([wildCard1, wildCard2]);
        }).not.toThrow();
      });
    });

    // ==========================================
    // EXTENDED PATTERN FAILURES
    // ==========================================
    describe('Pattern Failures', () => {
      it('should throw EnforcedColorMismatch at the start of a chain', () => {
        gameBoard.setCurrentTopCard(wildCard1);
        gameBoard.setEnforcedColor(CardColor.BLUE);
        expect(() => {
          gameBoard.processPattern([redOne, redTwo]);
        }).toThrow(EnforcedColorMismatch);
      });

      it('should throw CardTypeMismatch when mixing Types in a chain (Number -> Action)', () => {
        // Red 2 (Number) -> Red Skip (Action)
        expect(() => {
          gameBoard.processPattern([redTwo, redSkip]);
        }).toThrow(CardTypeMismatch);
      });

      it('should throw CardTypeMismatch when mixing Types in a chain (Wild -> Number)', () => {
        // Wild 1 (Wild) -> Red One (Number)
        expect(() => {
          gameBoard.processPattern([wildCard1, redOne]);
        }).toThrow(CardTypeMismatch);
      });

      it('should fail if a long chain breaks sequence at the very end', () => {
        const brokenChain = [redTwo, redThree, redFour, blueFive];
        expect(() => {
          gameBoard.processPattern(brokenChain);
        }).toThrow(CardPatternMismatch);
      });

      it('should fail if the gap between numbers is too large', () => {
        // Red 1 -> Red 3 (Gap is 2)
        expect(() => {
          gameBoard.processPattern([redThree]);
        }).toThrow(CardPatternMismatch);
      });

      it('should fail if numbers are descending', () => {
        // Red 3 -> Red 2 (Descending)
        gameBoard.setCurrentTopCard(redThree);
        expect(() => {
          gameBoard.processPattern([redTwo]);
        }).toThrow(CardPatternMismatch);
      });

      it('should fail if switching color without matching value (Bridge Mismatch)', () => {
        // Red 3 -> Blue 4 (Color switch must require Value Match first)
        gameBoard.setCurrentTopCard(redThree);
        expect(() => {
          gameBoard.processPattern([blueFour]);
        }).toThrow(CardPatternMismatch);
      });

      it('should fail if Action cards do not match value', () => {
        // Red Skip -> Red Reverse
        gameBoard.setCurrentTopCard(redSkip);
        expect(() => {
          gameBoard.processPattern([redReverse]);
        }).toThrow(CardPatternMismatch);
      });

      it('should fail if Action cards match color but not value', () => {
        // Red Skip -> Red Reverse
        gameBoard.setCurrentTopCard(redSkip);
        gameBoard.setEnforcedColor(CardColor.RED);
        expect(() => {
          gameBoard.processPattern([redReverse]);
        }).toThrow(CardPatternMismatch);
      });

      it('should fail if Action cards match value but mixed with other actions', () => {
        // Red Skip -> Blue Reverse (Mismatch Value & Type Logic)
        gameBoard.setCurrentTopCard(redSkip);
        expect(() => {
          gameBoard.processPattern([blueReverse]);
        }).toThrow(CardPatternMismatch);
      });
    });
  });

  describe('Next Turn Events', () => {
    it('should calculate events correctly for mixed action types', () => {
      const cards = [
        createCard('s1', CardColor.RED, CardValue.SKIP, 'S1'),
        createCard('d1', CardColor.RED, CardValue.DRAW_TWO, 'D1'),
        createCard('d2', CardColor.BLUE, CardValue.DRAW_TWO, 'D2'),
        createCard('w1', CardColor.BLACK, CardValue.WILD_DRAW_FOUR, 'WD4'),
      ];

      const events = gameBoard.getNextTurnEvents(cards);

      expect(events.skip_amount).toBe(1);
      expect(events.draw_two_amount).toBe(2);
      expect(events.wild_draw_four_amount).toBe(1);
      expect(events.reverse_amount).toBe(0);
    });
  });
});
