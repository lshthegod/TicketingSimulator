import { Injectable } from '@nestjs/common';
import { CreateSeatDto } from './dto/create-seat.dto';
import { CreateBulkSeatsDto } from './dto/create-bulk-seats.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SeatEntity, SeatStatus } from './entities/seat.entity';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SeatsService {
  private readonly redisClient: Redis;

  constructor(
    @InjectRepository(SeatEntity)
    private readonly seatsRepository: Repository<SeatEntity>,
    private readonly configService: ConfigService,
  ) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST') || 'localhost',
      port: this.configService.get<number>('REDIS_PORT') || 6379,
    });
  }

  async findAllByEventId(eventId: number) {
    const cacheKey = `seats:event:${eventId}`;

    const cachedSeats = await this.redisClient.get(`seats:event:${eventId}`);
    if (cachedSeats) {
      return JSON.parse(cachedSeats);
    }

    const seats = await this.seatsRepository.find({
      where: { event: { id: eventId } },
      select: ['id', 'seatNo', 'status'],
      order: { seatNo: 'ASC' },
    });

    const slimSeats = seats.map((seat) => ({
      id: seat.id,
      no: seat.seatNo,
      st: seat.status,
    }));

    await this.redisClient.set(cacheKey, JSON.stringify(slimSeats), 'EX', 1);

    return slimSeats;
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
