import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { EventEntity } from 'src/events/entities/event.entity';
import { ReservationEntity } from 'src/reservations/entities/reservation.entity';

export enum SeatStatus {
    AVAILABLE = 'AVAILABLE',
    HELD = 'HELD',
    BOOKED = 'BOOKED',
}

@Entity('seats')
export class SeatEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'event_id'}) 
    eventId: number;

    @Column({length: 20})
    seatNo: string;

    @Column({type: 'enum',
        enum: SeatStatus,
        default: SeatStatus.AVAILABLE,
    })
    status: SeatStatus;

    @Column({type: 'datetime', name: 'hold_expires_at', nullable: true})
    holdExpiresAt: Date;

    @ManyToOne(() => EventEntity, event => event.seats, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({name: 'event_id'})
    event: EventEntity;

    @OneToOne(() => ReservationEntity, (reservation) => reservation.seat)
    reservation: ReservationEntity;
}
