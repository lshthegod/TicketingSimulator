import { Injectable } from '@nestjs/common';
import { CreateSeatDto } from './dto/create-seat.dto';
import { CreateBulkSeatsDto } from './dto/create-bulk-seats.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SeatEntity, SeatStatus } from './entities/seat.entity';
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

  async createBulk(createBulkSeatsDto: CreateBulkSeatsDto) {
    const { eventId, rowCount, seatPerCol } = createBulkSeatsDto;
    const seatsToSave: Partial<SeatEntity>[] = [];

    for (let row = 0; row < rowCount; row++) {
      const rowChar = String.fromCharCode(65 + row);
      for (let col = 1; col <= seatPerCol; col++) {
        seatsToSave.push({
          eventId: eventId,
          seatNo: `${rowChar}${col}`,
          status: SeatStatus.AVAILABLE,
        });
      }
    }

    return await this.seatsRepository.save(seatsToSave);
  }
}
