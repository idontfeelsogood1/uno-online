import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';
import { CardColor } from '../class/card/Card';

export class PlayCardsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  cardsToPlayIds: string[];

  wildColor?: CardColor;
}
