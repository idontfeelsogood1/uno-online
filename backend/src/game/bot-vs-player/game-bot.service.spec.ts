import { Test, TestingModule } from '@nestjs/testing';
import { GameBotService } from './game-bot.service';

describe('GameBotService', () => {
  let service: GameBotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameBotService],
    }).compile();

    service = module.get<GameBotService>(GameBotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
