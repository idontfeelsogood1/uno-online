import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class CardsToPlayIdsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  cardsToPlayIds: string[];
}
