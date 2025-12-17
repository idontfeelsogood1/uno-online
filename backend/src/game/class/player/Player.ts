import { Card } from '../card/Card';

export class Player {
  readonly socketId: string;
  readonly username: string;
  private hand: Card[];
  private uno: boolean;

  constructor(socketId: string, username: string, hand: Card[], uno: boolean) {
    this.socketId = socketId;
    this.username = username;
    this.hand = hand;
    this.uno = uno;
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
    const idsToRemove = new Set(cardIds);
    const removedItems: Card[] = [];

    for (const card of this.hand) {
      if (idsToRemove.has(card.id)) {
        const index = this.hand.indexOf(card);
        const arr = this.hand.splice(index, 1);
        removedItems.push(arr[0]);
      }
    }

    return removedItems;
  }

  public setIsUno(isUno: boolean): void {
    this.uno = isUno;
  }

  public isUno(): boolean {
    return this.uno;
  }
}
