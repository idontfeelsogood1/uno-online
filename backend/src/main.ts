import { NestFactory } from '@nestjs/core';
import { GameModule } from './game/game.module';

async function bootstrap() {
  const app = await NestFactory.create(GameModule);

  let originUrl: string;
  if (process.env.NODE_ENV === 'production') {
    originUrl = process.env.FRONTEND_URL!;
  } else {
    originUrl = '*';
  }

  app.enableCors({
    origin: originUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(3000);
}

void bootstrap();
