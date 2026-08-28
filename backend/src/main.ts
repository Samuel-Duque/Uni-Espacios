import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { patchNestJsSwagger, ZodValidationPipe } from 'nestjs-zod';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // Habilitar compatibilidad de tipos Zod -> OpenAPI Swagger
  patchNestJsSwagger();

  const app = await NestFactory.create(AppModule);

  // Prefijo global de la API
  app.setGlobalPrefix('api');

  // Seguridad HTTP
  app.use(helmet());
  app.use(cookieParser());

  // CORS para desarrollo (restringir en producción)
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Pipe global de validación Zod
  app.useGlobalPipes(new ZodValidationPipe());

  // Filtro global de excepciones HTTP
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configuración de Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Uni-Espacios API')
    .setDescription(
      'API del Sistema de Gestión, Reserva de Espacios Físicos y Control de Inventario - Politécnico Colombiano Jaime Isaza Cadavid',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Uni-Espacios Backend corriendo en: http://localhost:${port}`);
  console.log(`📚 Swagger UI disponible en: http://localhost:${port}/api/docs`);
}

bootstrap();
