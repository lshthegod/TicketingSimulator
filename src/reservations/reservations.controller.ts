import { Controller, Post, Body, Req, UnauthorizedException, Param, ParseIntPipe } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import type { Request } from 'express';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post('hold')
  async holdSeat(@Req() req: Request, @Body() createReservationDto: CreateReservationDto) {
    const user = req['user'];

    if (!user) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    return await this.reservationsService.holdSeat(user.id, createReservationDto.seatId);
  }

  @Post(':id/confirm')
  async confirmReservation(@Req() req: Request, @Param('id', ParseIntPipe) reservationId: number) {
    const user = req['user'];

    if (!user) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    return await this.reservationsService.confirmReservation(user.id, reservationId);
  }
}
