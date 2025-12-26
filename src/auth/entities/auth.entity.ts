import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    OneToMany,
} from 'typeorm';
import { ReservationEntity } from 'src/reservations/entities/reservation.entity';
  
@Entity('auth')
export class AuthEntity {
    @PrimaryGeneratedColumn({ unsigned: true })
    id: number;
  
    @Index({ unique: true })
    @Column({ type: 'varchar', length: 255 })
    email: string;

    @Column({ type: 'varchar', length: 50 })
    nickname: string;

    @Column({ type: 'varchar', length: 255, select: false })
    password: string;
  
    @CreateDateColumn({
      type: 'datetime',
      name: 'created_at',
    })
    createdAt: Date;

    @Column({ default: false })
    isGuest: boolean;

    @OneToMany(() => ReservationEntity, (reservation) => reservation.userId)
    reservations: ReservationEntity[];
}
  