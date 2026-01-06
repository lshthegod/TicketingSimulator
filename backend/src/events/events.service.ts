import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventEntity } from './entities/event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
  ) {}

  async create(createEventDto: CreateEventDto) {
    const event = this.eventRepository.create(createEventDto);
    return await this.eventRepository.save(event);
  }

  async findAllByOpenAtAsc() {
    return await this.eventRepository.find({
      order: { openAt: 'ASC' }
    });
  }

  async findAllByCreatedAtDesc() {
    return await this.eventRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number) {
    return await this.eventRepository.findOne({ where: { id } });
  }

  // 추후 구현
  update(id: number, updateEventDto: UpdateEventDto) {
    return `This action updates a #${id} event`;
  }

  // 추후 구현
  remove(id: number) {
    return `This action removes a #${id} event`;
  }
}
