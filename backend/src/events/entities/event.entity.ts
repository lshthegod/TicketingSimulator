import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { SeatEntity } from 'src/seats/entities/seat.entity';

@Entity('events')
export class EventEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({type: 'text', nullable: true})
    description: string;

    @Column({type: 'datetime', name: 'open_at'})
    openAt: Date;

    @Column({default: 0, name: 'total_seats'})
    totalSeats: number;

    @CreateDateColumn({name: 'created_at'})
    createdAt: Date;

    @UpdateDateColumn({name: 'updated_at'})
    updatedAt: Date;

    @OneToMany(() => SeatEntity, (seat) => seat.event)
    seats: SeatEntity[];
}
