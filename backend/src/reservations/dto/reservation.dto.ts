import { IsInt, IsNotEmpty, IsNumber } from 'class-validator';

export class ReservationDto {
  @IsNotEmpty()
  @IsInt()
  seatId: number;

  @IsNumber()
  eventId: number;
}