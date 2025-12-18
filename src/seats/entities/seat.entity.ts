import { EventEntity } from 'src/events/entities/event.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

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

    @Column({type: 'datetime', nullable: true})
    holdExpiresAt: Date;

    @ManyToOne(() => EventEntity, event => event.seats, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({name: 'event_id'})
    event: EventEntity;
}
