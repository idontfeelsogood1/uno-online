import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';
import { CardColor } from '../model/card/Card';

export class PlayCardsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  cardsToPlayIds: string[];

  wildColor?: CardColor;
}
