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

  public processPattern(cards: Card[]): nextTurnEvents {}
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

export class AmountGreaterThanDrawPile extends Error {
  constructor(message: string, options: object) {
    super(message, options);
  }
}
