import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { EventOpenGuard } from 'src/events/event-open.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { SeatsService } from './seats.service';
import { CreateBulkSeatsDto } from './dto/create-bulk-seats.dto';

@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Get('event/:eventId')
  @UseGuards(JwtAuthGuard, EventOpenGuard)
  findAllByEventId(@Param('eventId') eventId: number) {
    return this.seatsService.findAllByEventId(eventId);
  }

  @Post('bulk')
  createBulk(@Body() createBulkSeatsDto: CreateBulkSeatsDto) {
    return this.seatsService.createBulk(createBulkSeatsDto);
  }
}
