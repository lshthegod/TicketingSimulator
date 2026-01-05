import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // app.setGlobalPrefix('api');
  // app.use(morgan('dev'));
  app.use(helmet());
  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe(
    {
      forbidNonWhitelisted: true,
      whitelist: true,
      transform: true,
    }
  ));
  const dataSource = app.get(DataSource);

  if (dataSource.isInitialized) {
    console.log('📦 데이터베이스 연결 성공!');
  } else {
    console.error('❌ 데이터베이스 연결 실패!');
  }

  app.enableCors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  });
  const port = process.env.PORT ?? 8080;

  await app.listen(port);
  console.log(`서버가 ${port} 포트에서 실행 중입니다.`);
  console.log(`http://localhost:${port}`);
}
bootstrap();
