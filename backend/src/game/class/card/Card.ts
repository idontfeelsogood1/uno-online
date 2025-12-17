import { CardColor } from './card-color.enum';
import { CardValue } from './card-value.enum';

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
