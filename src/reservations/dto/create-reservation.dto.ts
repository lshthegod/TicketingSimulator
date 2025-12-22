import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateReservationDto {
  @IsNotEmpty()
  @IsInt()
  seatId: number;
}