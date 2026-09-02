import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { patchNestJsSwagger, ZodValidationPipe } from 'nestjs-zod';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Prefijo Global de API
  app.setGlobalPrefix('api');

  // 2. Seguridad HTTP y Cookies
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // 3. Pipeline Global: Pipes y Filters
  patchNestJsSwagger(); // Habilita integración Zod -> Swagger
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new PrismaClientExceptionFilter(),
  );

  // 4. Configuración Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Uni-Espacios API - Politécnico Jaime Isaza Cadavid')
    .setDescription(
      'API REST para la gestión de espacios físicos, reservas e inventario de implementos',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('refreshToken')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 Servidor ejecutándose en http://localhost:${port}/api`);
  logger.log(`📑 Documentación Swagger disponible en http://localhost:${port}/api/docs`);
}

bootstrap();
