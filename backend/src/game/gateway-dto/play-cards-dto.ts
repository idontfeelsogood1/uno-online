import {
  IsArray,
  IsString,
  IsBoolean,
  ArrayNotEmpty,
  IsOptional,
} from 'class-validator';
import { CardColor } from '../model/card/Card';

export class PlayCardsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  cardsToPlayIds: string[];

  wildColor?: CardColor;

  @IsBoolean()
  @IsOptional()
  uno: boolean = false;
}
