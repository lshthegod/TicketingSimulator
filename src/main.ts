import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { DataSource } from 'typeorm';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  const dataSource = app.get(DataSource);

  if (dataSource.isInitialized) {
    console.log('📦 데이터베이스 연결 성공!');
  } else {
    console.error('❌ 데이터베이스 연결 실패!');
  }

  app.enableCors({
    origin: true,
    credentials: true,
  });
  const port = process.env.PORT ?? 3000;

  await app.listen(port);
  console.log(`서버가 ${port} 포트에서 실행 중입니다.`);
  console.log(`http://localhost:${port}`);
}
bootstrap();
