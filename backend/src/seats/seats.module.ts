import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeatsController } from './seats.controller';
import { SeatsService } from './seats.service';
import { SeatEntity } from './entities/seat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SeatEntity])],
  controllers: [SeatsController],
  providers: [SeatsService],
  exports: [SeatsService],
})
export class SeatsModule {}
