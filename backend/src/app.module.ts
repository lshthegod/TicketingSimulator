import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { QueueModule } from './queue/queue.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { SeatsModule } from './seats/seats.module';
import { ReservationsModule } from './reservations/reservations.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // 환경 변수 전역 설정
    ConfigModule.forRoot({isGlobal: true}),
    DatabaseModule,
    AuthModule,
    EventsModule,
    SeatsModule,
    ReservationsModule,
    ScheduleModule.forRoot(),
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtService],
})
export class AppModule {
}