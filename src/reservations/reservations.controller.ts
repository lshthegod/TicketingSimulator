import { Controller, Post, Body, Req } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import type { Request } from 'express';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  async create(@Req() req: Request, @Body() createReservationDto: CreateReservationDto) {
    const user = req['user'];

    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    return await this.reservationsService.reserve(user.id, createReservationDto);
  }
}
