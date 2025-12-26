import { IsInt, IsNotEmpty } from 'class-validator';

export class ReservationDto {
  @IsNotEmpty()
  @IsInt()
  seatId: number;
}