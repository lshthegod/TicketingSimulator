export type SeatStatus = 'AVAILABLE' | 'BOOKED';

export interface Seat {
    id: string;
    runId: string;
    seatNo: string;
    status: SeatStatus;
    updatedAt: Date;
}