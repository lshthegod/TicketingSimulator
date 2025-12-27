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

    @Column({type: 'datetime'})
    openAt: Date;

    @Column({default: 0})
    totalSeats: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => SeatEntity, (seat) => seat.event)
    seats: SeatEntity[];
}
