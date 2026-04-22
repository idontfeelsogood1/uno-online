import { Module } from '@nestjs/common';
import { GameGateway } from './player-vs-player/game.gateway';
import { GameService } from './player-vs-player/game.service';
import { GameBotGateway } from './bot-vs-player/game-bot.gateway';
import { GameBotService } from './bot-vs-player/game-bot.service';

@Module({
  providers: [GameGateway, GameService, GameBotGateway, GameBotService],
})
export class GameModule {}
