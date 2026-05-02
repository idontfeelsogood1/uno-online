import { Module } from '@nestjs/common';
import { GamePlayerGateway } from './player-vs-player/game-player.gateway';
import { GamePlayerService } from './player-vs-player/game-player.service';
import { GameBotGateway } from './bot-vs-player/game-bot.gateway';
import { GameBotService } from './bot-vs-player/game-bot.service';
import { GameEngine } from './engine/game.engine';

@Module({
  providers: [
    GamePlayerGateway,
    GamePlayerService,
    GameBotGateway,
    GameBotService,
    GameEngine,
  ],
})
export class GameModule {}
