import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { AuthEntity } from "src/auth/entities/auth.entity";
import { SeatEntity } from "src/seats/entities/seat.entity";

@Entity('reservations')
export class ReservationEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'user_id'})
    userId: number;

    @Column({name: 'seat_id'})
    seatId: number;

    @CreateDateColumn({name: 'created_at'})
    createdAt: Date;

    @ManyToOne(() => AuthEntity, (auth) => auth.reservations)
    @JoinColumn({name: 'user_id'})
    user: AuthEntity;

    @OneToOne(() => SeatEntity, (seat) => seat.reservation)
    @JoinColumn({name: 'seat_id'})
    seat: SeatEntity;
}