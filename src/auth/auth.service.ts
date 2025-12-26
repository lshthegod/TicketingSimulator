import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthEntity } from './entities/auth.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

import { randomInt } from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(AuthEntity)
        private readonly authRepository: Repository<AuthEntity>,
        private readonly jwtService: JwtService,
    ) {}

    async register(dto: RegisterDto) {
        const [emailExists, nicknameExists] = await Promise.all([
            this.authRepository.findOne({ where: { email: dto.email } }),
            this.authRepository.findOne({ where: { nickname: dto.nickname } }),
        ]);
        if (emailExists) {
            throw new ConflictException('이미 존재하는 이메일입니다.');
        }
        if (nicknameExists) {
            throw new ConflictException('이미 존재하는 닉네임입니다.');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = this.authRepository.create({
            ...dto,
            password: hashedPassword,
        });

        await this.authRepository.save(user);

        return {
            id: user.id,
            nickname: user.nickname,
            email: user.email
        };
    }

    async login(dto: LoginDto) {
        const user = await this.authRepository.findOne({
            where: { email: dto.email },
            select: { id: true, email: true, nickname: true, password: true },
        });
        if (!user) {
            throw new UnauthorizedException('이메일 또는 비밀번호를 확인해주세요.');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('이메일 또는 비밀번호를 확인해주세요.');
        }

        const payload = { id: user.id, nickname: user.nickname, email: user.email };
        const token = this.jwtService.sign(payload);

        return {
            accessToken: token,
            message: '로그인 성공',
        };
    }
    
    async guest() {
        let guestNumStr: string;
        let exists: AuthEntity | null;

        do {
            const firstDigit = randomInt(1, 10);
            const guestNum = `${firstDigit}${Array.from({ length: 9 },() => randomInt(0, 10)).join('')}`;

            guestNumStr = guestNum;

            exists = await this.authRepository.findOne({where: { nickname: `게스트_${guestNumStr}` }});
        } while (exists);
                
        const guestUser = this.authRepository.create({
            email: `guest_${guestNumStr}@temp.com`,
            password: await bcrypt.hash(guestNumStr, 10),
            nickname: `게스트_${guestNumStr}`,
            isGuest: true,
        });

        await this.authRepository.save(guestUser);


        const payload = { id: guestUser.id, nickname: guestUser.nickname, email: guestUser.email };
        const token = this.jwtService.sign(payload);

        return {
            accessToken: token,
            message: '게스트 로그인 성공',
        };
    }
}
