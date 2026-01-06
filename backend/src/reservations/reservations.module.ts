import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeatEntity } from 'src/seats/entities/seat.entity';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { ReservationEntity } from './entities/reservation.entity';
import { ReservationsScheduler } from './reservations.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([ReservationEntity, SeatEntity])],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsScheduler],
})
export class ReservationsModule {}
