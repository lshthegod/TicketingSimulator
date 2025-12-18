import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SeatsService } from './seats.service';
import { CreateSeatDto } from './dto/create-seat.dto';
import { CreateBulkSeatsDto } from './dto/create-bulk-seats.dto';

@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post()
  create(@Body() createSeatDto: CreateSeatDto) {
    return this.seatsService.create(createSeatDto);
  }

  @Get('event/:eventId')
  findAllByEventId(@Param('eventId') eventId: string) {
    return this.seatsService.findAllByEventId(+eventId);
  }

  @Post('bulk')
  createBulk(@Body() createBulkSeatsDto: CreateBulkSeatsDto) {
    return this.seatsService.createBulk(createBulkSeatsDto);
  }
}
