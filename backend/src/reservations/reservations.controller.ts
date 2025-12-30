import { Controller, Get, Post, Body, Req, UnauthorizedException, Param, UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationDto } from './dto/reservation.dto';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { ActiveQueueGuard } from 'src/queue/queue.guard';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getReservations(@User() user: any) {
    return await this.reservationsService.findAllByUserId(user.id);
  }
  
  @UseGuards(JwtAuthGuard, ActiveQueueGuard)
  @Post('hold')
  async holdSeat(@Req() req: Request, @Body() reservationDto: ReservationDto) {
    const user = req['user'];

    if (!user) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    return await this.reservationsService.holdSeat(user.id, reservationDto.seatId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm/:id')
  async confirmReservation(@Req() req: Request, @Param('id') reservationId: number) {
    const user = req['user'];

    if (!user) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    return await this.reservationsService.confirmReservation(user.id, reservationId);
  }
}
