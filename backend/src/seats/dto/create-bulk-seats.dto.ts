import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class CreateBulkSeatsDto {
  @IsNotEmpty()
  @IsInt()
  eventId: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(26)
  rowCount: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(16)
  seatPerCol: number;
}