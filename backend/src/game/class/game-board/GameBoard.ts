import { Card } from '../card/Card';

export class GameBoard {
  readonly id: string;
  private discardPile: Card[];
  private drawPile: Card[];
  private currentTopCard: Card | null;

  constructor(id: string) {
    this.id = id;
    this.discardPile = [];
    this.drawPile = [];
    this.currentTopCard = null;
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
}

export class AmountGreaterThanDrawPile extends Error {
  constructor(message: string, options: object) {
    super(message, options);
  }
}
