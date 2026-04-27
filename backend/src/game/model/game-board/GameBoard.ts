import { Card, CardColor, CardValue } from '../card/Card';
import { randomUUID } from 'crypto';

export class GameBoard {
  readonly id: string;
  private discardPile: Card[];
  private drawPile: Card[];
  private turnEvents: TurnEvents;
  private currentTopCard: Card | null;
  private enforcedColor: CardColor | null;

  constructor(id: string) {
    this.id = id;
    this.discardPile = [];
    this.drawPile = [];
    this.turnEvents = new TurnEvents(0, 0, 0, 0, 0);
    this.currentTopCard = null;
    this.enforcedColor = null;
  }

  public getDiscardPile(): Card[] {
    return this.discardPile;
  }

  public pushToDiscardPile(cards: Card[]): void {
    cards.forEach((card) => {
      this.discardPile.push(card);
    });
  }

  // This clears the pile except the top card
  public clearDiscardPile(): Card[] {
    const topCard: Card = this.discardPile.pop()!;
    const clearedPile: Card[] = [];

    this.discardPile.forEach((card) => {
      clearedPile.push(card);
    });

    this.discardPile = [topCard];
    return clearedPile;
  }

  public getDrawPile(): Card[] {
    return this.drawPile;
  }

  public pushToDrawPile(cards: Card[]): void {
    cards.forEach((card) => {
      this.drawPile.push(card);
    });
  }

  public shuffleDrawPile(): void {
    // Start from the last element and swap it with a random element before it
    for (let i = this.drawPile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      // Swap elements at i and j
      [this.drawPile[i], this.drawPile[j]] = [
        this.drawPile[j],
        this.drawPile[i],
      ];
    }
  }

  public popFromDrawPile(amount: number): Card[] {
    const poppedCards: Card[] = [];

    if (amount > this.drawPile.length) {
      throw new AmountGreaterThanDrawPile(
        `
        Amount: ${amount} 
        Draw Pile: ${this.drawPile.length}
        `,
        {},
      );
    }

    for (let i = 0; i < amount; i++) {
      poppedCards.push(this.drawPile.pop()!);
    }

    return poppedCards;
  }

  public setCurrentTopCard(card: Card): void {
    this.currentTopCard = card;
  }

  public getCurrentTopCard(): Card {
    return this.currentTopCard!;
  }

  public setEnforcedColor(color: CardColor): void {
    this.enforcedColor = color;
  }

  public getEnforcedColor(): CardColor {
    return this.enforcedColor!;
  }

  public getCardType(card: Card): string {
    if (
      card.value === CardValue.SKIP ||
      card.value === CardValue.REVERSE ||
      card.value === CardValue.DRAW_TWO
    ) {
      return 'ACTION';
    }
    if (
      card.value === CardValue.WILD ||
      card.value === CardValue.WILD_DRAW_FOUR
    ) {
      return 'WILD';
    }
    return 'NUMBER';
  }

  public isValidFirstMove(card: Card): boolean {
    const firstCardIsWild: boolean = this.getCardType(card) === 'WILD';
    const topCardIsWild: boolean =
      this.getCardType(this.getCurrentTopCard()) === 'WILD';
    const firstCardMatchEnforcedColorOrWild: boolean =
      card.color === this.enforcedColor || this.getCardType(card) === 'WILD';
    const firstCardMatchTopCardColor: boolean =
      this.getCurrentTopCard().color === card.color;
    if (
      firstCardIsWild ||
      (topCardIsWild && firstCardMatchEnforcedColorOrWild) ||
      firstCardMatchTopCardColor ||
      this.isMatchingPattern(this.getCurrentTopCard(), card)
    ) {
      return true;
    }

    return false;
  }

  // ONLY WORKS CORRECTLY AFTER isValidFirstMove
  public isMatchingPattern(previousTopCard: Card, currentCard: Card): boolean {
    if (this.getCardType(currentCard) !== this.getCardType(previousTopCard)) {
      return false;
    }

    if (this.getCardType(previousTopCard) === 'NUMBER') {
      const sameColorMatchingPattern: boolean =
        currentCard.color === previousTopCard.color &&
        (parseInt(currentCard.value) - parseInt(previousTopCard.value) === 0 ||
          parseInt(currentCard.value) - parseInt(previousTopCard.value) === 1);
      const differentColorSameValue: boolean =
        currentCard.color !== previousTopCard.color &&
        currentCard.value === previousTopCard.value;

      if (!(sameColorMatchingPattern || differentColorSameValue)) {
        return false;
      }
    }

    if (
      this.getCardType(previousTopCard) === 'ACTION' ||
      this.getCardType(previousTopCard) === 'WILD'
    ) {
      if (currentCard.value !== previousTopCard.value) {
        return false;
      }
    }

    return true;
  }

  public processPattern(cards: Card[]): void {
    if (!this.isValidFirstMove(cards[0])) {
      throw new CardPatternMismatch(
        `
        Previous Card: ${this.getCurrentTopCard().name}
        Current Card: ${cards[0].name}
        Enforced Color: ${this.getEnforcedColor()}
        `,
        {
          cause: {
            cards: {
              prevCardId: this.getCurrentTopCard().id,
              currentCardId: cards[0].id,
            },
            enforcedColor: this.getEnforcedColor(),
          },
        },
      );
    }

    for (let i = 1; i < cards.length; i++) {
      const previousTopCard = cards[i - 1];
      const currentCard = cards[i];

      if (!this.isMatchingPattern(previousTopCard, currentCard)) {
        throw new CardPatternMismatch(
          `
        Previous Card: ${previousTopCard.name}
        Current Card: ${currentCard.name}
        Enforced Color: ${this.getEnforcedColor()}
        `,
          {
            cause: {
              cards: {
                prevCardId: previousTopCard.id,
                currentCardId: currentCard.id,
              },
              enforcedColor: this.getEnforcedColor(),
            },
          },
        );
      }
    }
  }

  // CALL THIS AFTER processPattern SUCCEED
  public setTurnEvents(cards: Card[]): void {
    let skip_amount: number = 0;
    let reverse_amount: number = 0;
    let draw_two_amount: number = 0;
    let wild_amount: number = 0;
    let wild_draw_four_amount: number = 0;

    for (const card of cards) {
      if (card.value === CardValue.SKIP) skip_amount++;
      if (card.value === CardValue.REVERSE) reverse_amount++;
      if (card.value === CardValue.DRAW_TWO) draw_two_amount++;
      if (card.value === CardValue.WILD) wild_amount++;
      if (card.value === CardValue.WILD_DRAW_FOUR) wild_draw_four_amount++;
    }

    this.turnEvents = new TurnEvents(
      skip_amount,
      reverse_amount,
      draw_two_amount,
      wild_amount,
      wild_draw_four_amount,
    );
  }

  public getTurnEvents(): TurnEvents {
    return this.turnEvents;
  }

  public generateUnoDeck(): Card[] {
    const deck: Card[] = [];

    // Helper to generate a unique ID
    const generateId = (): string => randomUUID();

    const colors = [
      CardColor.RED,
      CardColor.BLUE,
      CardColor.GREEN,
      CardColor.YELLOW,
    ];

    const numberValues = [
      CardValue.ONE,
      CardValue.TWO,
      CardValue.THREE,
      CardValue.FOUR,
      CardValue.FIVE,
      CardValue.SIX,
      CardValue.SEVEN,
      CardValue.EIGHT,
      CardValue.NINE,
    ];

    const actionValues = [
      CardValue.SKIP,
      CardValue.REVERSE,
      CardValue.DRAW_TWO,
    ];

    // 1. Add Number Cards (0-9) and Action Cards
    colors.forEach((color) => {
      // ONE '0' card per color
      deck.push(
        new Card(
          generateId(),
          `${color} ${CardValue.ZERO}`,
          color,
          CardValue.ZERO,
        ),
      );

      // TWO of each number (1-9) per color
      numberValues.forEach((value) => {
        for (let i = 0; i < 2; i++) {
          deck.push(new Card(generateId(), `${color} ${value}`, color, value));
        }
      });

      // TWO of each action (Skip, Reverse, Draw Two) per color
      actionValues.forEach((value) => {
        for (let i = 0; i < 2; i++) {
          deck.push(new Card(generateId(), `${color} ${value}`, color, value));
        }
      });
    });

    // 2. Add Wild Cards (4 of each)
    for (let i = 0; i < 4; i++) {
      // Standard Wild
      deck.push(
        new Card(generateId(), 'Wild', CardColor.BLACK, CardValue.WILD),
      );

      // Wild Draw Four
      deck.push(
        new Card(
          generateId(),
          'Wild Draw Four',
          CardColor.BLACK,
          CardValue.WILD_DRAW_FOUR,
        ),
      );
    }

    return deck;
  }

  // ONLY ALLOWS NUMBER TYPE
  public startDiscardPile(): void {
    const pseudoDrawPile: Card[] = this.getDrawPile();
    for (let i = 0; i < pseudoDrawPile.length; i++) {
      if (this.getCardType(pseudoDrawPile[i]) === 'NUMBER') {
        const card = this.drawPile.splice(i, 1);
        return this.pushToDiscardPile(card);
      }
    }
  }
}

export class TurnEvents {
  readonly skip_amount: number;
  readonly reverse_amount: number;
  readonly draw_two_amount: number;
  readonly wild_amount: number;
  readonly wild_draw_four_amount: number;

  constructor(
    skip_amount: number,
    reverse_amount: number,
    draw_two_amount: number,
    wild_amount: number,
    wild_draw_four_amount: number,
  ) {
    this.skip_amount = skip_amount;
    this.reverse_amount = reverse_amount;
    this.draw_two_amount = draw_two_amount;
    this.wild_amount = wild_amount;
    this.wild_draw_four_amount = wild_draw_four_amount;
  }
}

export class CardPatternMismatch extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'CardPatternMismatch';
  }
}

export class AmountGreaterThanDrawPile extends Error {
  constructor(message: string, options: object) {
    super(message, options);
    this.name = 'AmountGreaterThanDrawPile';
  }
}
