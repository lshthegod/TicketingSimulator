import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationEntity } from './entities/reservation.entity';
import { SeatEntity } from 'src/seats/entities/seat.entity';
import { ReservationsScheduler } from './reservations.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([ReservationEntity, SeatEntity])],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsScheduler],
})
export class ReservationsModule {}
