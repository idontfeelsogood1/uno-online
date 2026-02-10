import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  let originUrl: string;
  if (process.env.NODE_ENV === 'dev') {
    originUrl = '*';
  } else {
    originUrl = process.env.FRONTEND_URL!;
  }

  app.enableCors({
    origin: originUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
