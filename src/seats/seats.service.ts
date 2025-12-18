import { Injectable } from '@nestjs/common';
import { CreateSeatDto } from './dto/create-seat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SeatEntity } from './entities/seat.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SeatsService {
  constructor(
    @InjectRepository(SeatEntity)
    private readonly seatsRepository: Repository<SeatEntity>,
  ) {}

  async create(createSeatDto: CreateSeatDto) {
    const seat = this.seatsRepository.create(createSeatDto);
    return await this.seatsRepository.save(seat);
  }

  async findAllByEventId(eventId: number) {
    return await this.seatsRepository.find({
      where: { event: { id: eventId } },
      order: { seatNo: 'ASC' },
     });
  }
}
