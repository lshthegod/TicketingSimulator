import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, LessThan } from 'typeorm';
import { SeatStatus } from 'src/seats/entities/seat.entity';
import { ReservationEntity, ReservationStatus } from './entities/reservation.entity';

@Injectable()
export class ReservationsScheduler {
  private readonly logger = new Logger(ReservationsScheduler.name);

  constructor(
    private readonly dataSource: DataSource, 
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredReservations() {
    this.logger.log('만료된 예약을 처리합니다.');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const expiredReservations = await queryRunner.manager.find(ReservationEntity, {
        where: {
          status: ReservationStatus.PENDING,
          expiredAt: LessThan(new Date()),
        },
        relations: ['seat'],
      });

      if (expiredReservations.length === 0) {
        await queryRunner.commitTransaction();
        this.logger.log('만료된 예약이 없습니다.');
        return;
      }

      this.logger.log(`총 ${expiredReservations.length}개의 만료된 예약을 삭제하고 좌석을 풉니다.`);

      for (const reservation of expiredReservations) {
        if (reservation.seat) {
          reservation.seat.status = SeatStatus.AVAILABLE;
          await queryRunner.manager.save(reservation.seat);
        }

        await queryRunner.manager.remove(reservation);
        
        this.logger.debug(`예약 삭제됨: ID ${reservation.id}, 좌석복구: ${reservation.seatId}`);
      }

      await queryRunner.commitTransaction();

    } catch (error) {
      this.logger.error('에러 발생, 롤백합니다.', error);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
}