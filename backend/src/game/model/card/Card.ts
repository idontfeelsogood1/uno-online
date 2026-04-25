export enum CardValue {
  ZERO = '0',
  ONE = '1',
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  SKIP = 'SKIP',
  REVERSE = 'REVERSE',
  DRAW_TWO = '+2',
  WILD = 'WILD',
  WILD_DRAW_FOUR = '+4',
}

export enum CardColor {
  RED = 'RED',
  BLUE = 'BLUE',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  BLACK = 'BLACK', // For Wild cards
}

export class Card {
  readonly id: string;
  readonly name: string;
  readonly color: CardColor;
  readonly value: CardValue;

  constructor(id: string, name: string, color: CardColor, value: CardValue) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.value = value;
  }
}
