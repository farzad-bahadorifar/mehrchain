import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { AllExceptionsFilter } from './app/common/filters/all-exceptions.filter';

async function bootstrap() {
  // Guard: Fail fast in production if JWT_SECRET is not configured
  if (process.env['NODE_ENV'] === 'production' && !process.env['JWT_SECRET']) {
    console.error('[FATAL] JWT_SECRET environment variable is not set. Refusing to start in production.');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  // Enable CORS for explicitly allowed origins only
  const allowedOrigins = [
    // Production: Cloudflare Pages
    'https://mehrchain.pages.dev',
    // Mobile: Capacitor WebView (Android & iOS)
    'capacitor://localhost',
    'ionic://localhost',
    // Local development
    'http://localhost:4200',
    'http://localhost:4300',
    'http://localhost:3000',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: Origin '${origin}' is not allowed.`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global request validation pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global standardized exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

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

