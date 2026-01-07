import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthEntity } from './entities/auth.entity';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: Repository<AuthEntity>;
  let jwtService: JwtService;

  // TypeORM Repository Mock
  const mockAuthRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  // JwtService Mock
  const mockJwtService = {
    sign: jest.fn(() => 'test_token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(AuthEntity),
          useValue: mockAuthRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authRepository = module.get<Repository<AuthEntity>>(getRepositoryToken(AuthEntity));
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const dto = { email: 'test@test.com', nickname: 'tester', password: '123' };

    it('성공 시 유저 정보를 반환해야 함', async () => {
      // Mock: 이메일, 닉네임 중복 없음
      jest.spyOn(authRepository, 'findOne').mockResolvedValue(null);
      // Mock: 비밀번호 해싱
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed_pw'));
      // Mock: 엔티티 생성 및 저장
      const savedUser = { id: 1, ...dto, password: 'hashed_pw' };
      jest.spyOn(authRepository, 'create').mockReturnValue(savedUser as any);
      jest.spyOn(authRepository, 'save').mockResolvedValue(savedUser as any);

      const result = await service.register(dto);

      expect(authRepository.findOne).toHaveBeenCalledTimes(2); // 이메일, 닉네임 체크
      expect(authRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: 1,
        nickname: dto.nickname,
        email: dto.email,
      });
    });

    it('이메일 중복 시 ConflictException 던짐', async () => {
      // Mock: 이메일 조회 시 결과 있음
      jest.spyOn(authRepository, 'findOne').mockResolvedValueOnce({ id: 1 } as any);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('닉네임 중복 시 ConflictException 던짐', async () => {
      // Mock: 이메일 없음, 닉네임 있음
      jest.spyOn(authRepository, 'findOne')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 1 } as any);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const dto = { email: 'test@test.com', password: '123' };
    const user = { id: 1, email: 'test@test.com', password: 'hashed_pw', nickname: 'tester' };

    it('성공 시 토큰을 반환해야 함', async () => {
      jest.spyOn(authRepository, 'findOne').mockResolvedValue(user as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await service.login(dto);

      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toEqual({ accessToken: 'test_token', message: '로그인 성공' });
    });

    it('유저가 없으면 UnauthorizedException 던짐', async () => {
      jest.spyOn(authRepository, 'findOne').mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('비밀번호 불일치 시 UnauthorizedException 던짐', async () => {
      jest.spyOn(authRepository, 'findOne').mockResolvedValue(user as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('guest', () => {
    it('게스트 계정 생성 및 토큰 반환', async () => {
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('guest_hashed_pw'));
      
      const guestUser = { id: 99, email: 'guest_x@temp.com', nickname: '게스트_x', isGuest: true };
      jest.spyOn(authRepository, 'create').mockReturnValue(guestUser as any);
      jest.spyOn(authRepository, 'save').mockResolvedValue(guestUser as any);

      const result = await service.guest();

      expect(authRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        isGuest: true, // 게스트 플래그 확인
      }));
      expect(authRepository.save).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toEqual({ accessToken: 'test_token', message: '게스트 로그인 성공' });
    });
  });
});