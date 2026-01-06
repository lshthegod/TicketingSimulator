import { IsEnum, IsInt, IsNotEmpty, IsString } from "class-validator";
import { SeatStatus } from '../entities/seat.entity';

export class CreateSeatDto {
    @IsNotEmpty()
    @IsInt()
    eventId: number;

    @IsNotEmpty()
    @IsString()
    seatNo: string;

    @IsEnum(SeatStatus)
    status?: SeatStatus;
}
