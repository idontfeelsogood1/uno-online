import { Card, CardColor, CardValue } from '../card/Card';

export class GameBoard {
  readonly id: string;
  private discardPile: Card[];
  private drawPile: Card[];
  private currentTopCard: Card | null;
  private enforcedColor: CardColor | null;

  constructor(id: string) {
    this.id = id;
    this.discardPile = [];
    this.drawPile = [];
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
        `Amount: ${amount} 
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

  // ALLOW STACKING CARD OF 1 TYPE PER HAND
  public processPattern(cards: Card[]): void {
    let pseudoTopCard: Card = this.currentTopCard!;

    const firstCardIsWild: boolean = this.getCardType(cards[0]) === 'WILD';
    const topCardIsWild: boolean = this.getCardType(pseudoTopCard) === 'WILD';
    const firstCardMatchEnforcedColorOrWild: boolean =
      cards[0].color === this.enforcedColor ||
      this.getCardType(cards[0]) === 'WILD';

    // THIS ENSURES ONLY THE FIRST CARD OF HAND THAT MATCHES THE CONSTRAINT IS SET AS pseudoTopCard
    if (
      firstCardIsWild ||
      (topCardIsWild && firstCardMatchEnforcedColorOrWild)
    ) {
      pseudoTopCard = cards[0];
    } else if (topCardIsWild) {
      throw new EnforcedColorMismatch(
        `
        Enforced color: ${this.enforcedColor}
        Top Card: ${pseudoTopCard.name}
        First card in cards: ${cards[0].name},
        `,
        {},
      );
    }

    for (const card of cards) {
      if (this.getCardType(card) !== this.getCardType(pseudoTopCard)) {
        throw new CardTypeMismatch(
          `
          Top card: ${pseudoTopCard.name}
          Top card type: ${this.getCardType(pseudoTopCard)}
          -------------------------------------------------
          Current card: ${card.name}
          Current card type: ${this.getCardType(card)}
          `,
          {},
        );
      }

      if (this.getCardType(pseudoTopCard) === 'NUMBER') {
        const sameColorMatchingPattern: boolean =
          card.color === pseudoTopCard.color &&
          (parseInt(card.value) - parseInt(pseudoTopCard.value) === 0 ||
            parseInt(card.value) - parseInt(pseudoTopCard.value) === 1);
        const differentColorSameValue: boolean =
          card.color !== pseudoTopCard.color &&
          card.value === pseudoTopCard.value;

        if (sameColorMatchingPattern || differentColorSameValue) {
          pseudoTopCard = card;
        } else {
          throw new CardPatternMismatch(
            `
            Top card: ${pseudoTopCard.name}
            Top card type: ${this.getCardType(pseudoTopCard)}
            -------------------------------------------------
            Current card: ${card.name}
            Current card type: ${this.getCardType(card)}
            `,
            {},
          );
        }
      }

      if (
        this.getCardType(pseudoTopCard) === 'ACTION' ||
        this.getCardType(pseudoTopCard) === 'WILD'
      ) {
        if (card.value === pseudoTopCard.value) {
          pseudoTopCard = card;
        } else {
          throw new CardPatternMismatch(
            `
            Top card: ${pseudoTopCard.name}
            Top card type: ${this.getCardType(pseudoTopCard)}
            -------------------------------------------------
            Current card: ${card.name}
            Current card type: ${this.getCardType(card)}
            `,
            {},
          );
        }
      }
    }
  }

  // CALL THIS AFTER processPattern SUCCEED
  public getNextTurnEvents(cards: Card[]): nextTurnEvents {
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

    return new nextTurnEvents(
      skip_amount,
      reverse_amount,
      draw_two_amount,
      wild_amount,
      wild_draw_four_amount,
    );
  }
}

export class nextTurnEvents {
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

export class EnforcedColorMismatch extends Error {
  constructor(message: string, options: object) {
    super(message, options);
  }
}

export class CardTypeMismatch extends Error {
  constructor(message: string, options: object) {
    super(message, options);
  }
}

export class CardPatternMismatch extends Error {
  constructor(message: string, options: object) {
    super(message, options);
  }
}

export class AmountGreaterThanDrawPile extends Error {
  constructor(message: string, options: object) {
    super(message, options);
  }
}
