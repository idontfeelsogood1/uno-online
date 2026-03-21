import { Card } from '../card/Card';

export class Player {
  readonly socketId: string;
  readonly username: string;
  private hand: Card[];
  private uno: boolean;

  constructor(socketId: string, username: string) {
    this.socketId = socketId;
    this.username = username;
    this.hand = [];
    this.uno = false;
  }

  public getHand(): Card[] {
    return this.hand;
  }

  public pushToHand(cards: Card[]): void {
    for (const card of cards) {
      this.hand.push(card);
    }
  }

  public removeCards(cardIds: string[]): Card[] {
    const removedItems: Card[] = [];

    cardIds.forEach((id) => {
      for (const card of this.getHand()) {
        if (card.id === id) {
          const index: number = this.hand.indexOf(card);
          const arr: Card[] = this.hand.splice(index, 1);
          removedItems.push(arr[0]);
          break;
        }
      }
    });

    return removedItems;
  }

  public getCardsToPlay(cardIds: string[]): Card[] {
    const cardsToPlay: Card[] = [];

    cardIds.forEach((id) => {
      for (const card of this.getHand()) {
        if (card.id === id) {
          cardsToPlay.push(card);
          break;
        }
      }
    });

    return cardsToPlay;
  }

  public setIsUno(isUno: boolean): void {
    this.uno = isUno;
  }

  public isUno(): boolean {
    return this.uno;
  }
}
