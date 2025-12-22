import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Repository } from 'typeorm';
import { ReservationEntity } from './entities/reservation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SeatEntity, SeatStatus } from 'src/seats/entities/seat.entity';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(ReservationEntity)
    private readonly reservationRepository: Repository<ReservationEntity>,

    @InjectRepository(SeatEntity)
    private readonly seatRepository: Repository<SeatEntity>,
  ) {}

  async reserve(userId: number, createReservationDto: CreateReservationDto) {
    const { seatId } = createReservationDto;
    
    const seat = await this.seatRepository.findOne({
      where: { id: seatId },
      relations: ['reservation'],
    });

    if (!seat) {
      throw new NotFoundException('존재하지 않는 좌석입니다.');
    }
    if (seat.reservation || seat.status !== SeatStatus.AVAILABLE) {
      throw new BadRequestException('이미 예약된 좌석입니다.');
    }
    const reservation = this.reservationRepository.create({
      userId: userId,
      seatId: seatId,
    });

    const savedReservation = await this.reservationRepository.save(reservation);

    // 트랜잭션 처리 필요
    seat.status = SeatStatus.BOOKED;
    await this.seatRepository.save(seat);

    return savedReservation;
  }
}