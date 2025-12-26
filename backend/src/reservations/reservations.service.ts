import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { DataSource, Repository } from 'typeorm';
import { ReservationEntity, ReservationStatus } from './entities/reservation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SeatEntity, SeatStatus } from 'src/seats/entities/seat.entity';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  async holdSeat(userId: number, seatId: number) {
    // QueryRunner 생성
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      const seat = await queryRunner.manager.findOne(SeatEntity, {
        where: { id: seatId },
        lock: { mode: 'pessimistic_write' }, 
      });

      if (!seat) throw new NotFoundException('좌석이 없습니다.');

      if (seat.status !== SeatStatus.AVAILABLE) {
        throw new ConflictException('이미 선택된 좌석입니다.');
      }

      const expireTime = new Date();
      expireTime.setMinutes(expireTime.getMinutes() + 2);

      const reservation = queryRunner.manager.create(ReservationEntity, {
        userId,
        seatId,
        status: ReservationStatus.PENDING,
        expiredAt: expireTime,
      });

      await queryRunner.manager.save(reservation);

      seat.status = SeatStatus.HELD;
      await queryRunner.manager.save(seat);

      await queryRunner.commitTransaction();

      return { 
        message: '좌석이 선점되었습니다. 5분 내에 결제해주세요.',
        reservationId: reservation.id,
        expiredAt: expireTime 
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async confirmReservation(userId: number, reservationId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reservation = await queryRunner.manager.findOne(ReservationEntity, {
        where: { id: reservationId },
        lock: { mode: 'pessimistic_write' },
        relations: ['seat'],
      });

      if (!reservation) throw new NotFoundException('예약 정보를 찾을 수 없습니다.');

      if (reservation.userId !== userId) {
        throw new ForbiddenException('본인의 예약만 확정할 수 있습니다.');
      }

      if (reservation.status === ReservationStatus.CONFIRMED) {
        throw new BadRequestException('이미 확정된 예약입니다.');
      }
      
      if (new Date() > reservation.expiredAt) {
        throw new BadRequestException('결제 시간이 만료되었습니다. 다시 예약해주세요.');
      }

      reservation.status = ReservationStatus.CONFIRMED;

      await queryRunner.manager.save(reservation);

      await queryRunner.commitTransaction();

      return { message: '예약이 최종 확정되었습니다.', reservation };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}