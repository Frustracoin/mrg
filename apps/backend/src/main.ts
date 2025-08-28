import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('MRG Loader API')
    .setDescription('API для загрузки и анализа данных МРГ')
    .setVersion('1.0')
    .addTag('mrg', 'Операции с данными МРГ')
    .addTag('upload', 'Загрузка файлов')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  });

  await app.listen(3001);
}
bootstrap();