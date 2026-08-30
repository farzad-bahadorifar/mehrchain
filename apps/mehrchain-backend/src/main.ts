import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend and mobile webview clients
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global request validation pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('MehrChain API')
    .setDescription('The MehrChain Backend API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env['PORT'] || 3000;
  await app.listen(port);
  Logger.log(`🚀 MehrChain Backend is running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`📚 Swagger API Docs available at: http://localhost:${port}/${globalPrefix}/docs`);
}

bootstrap();
