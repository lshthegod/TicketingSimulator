import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthEntity } from './entities/auth.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

// 1. 가짜 Repository 만들기 (Mock Object)
// 실제 DB 대신 이 객체가 호출됩니다.
const mockAuthRepository = {
  findOne: jest.fn(), // 조회 기능
  create: jest.fn(),  // 생성 기능
  save: jest.fn(),    // 저장 기능
  exists: jest.fn(),  // 존재 여부 확인 (최신 TypeORM 사용 시)
};

// 가짜 ConfigService
const mockConfigService = {
  get: jest.fn((key) => {
    if (key === 'SALT_ROUNDS') return 10;
    return null;
  }),
};

describe('AuthService', () => {
  let service: AuthService;
  let repository: typeof mockAuthRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        // 2. 의존성 주입 (가짜 객체 바꿔치기)
        {
          provide: getRepositoryToken(AuthEntity),
          useValue: mockAuthRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repository = module.get(getRepositoryToken(AuthEntity));
  });

  // 매 테스트마다 가짜 함수 기록 초기화
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const dto = {
      email: 'test@example.com',
      nickname: 'tester',
      password: 'password123',
    };

    it('성공: 중복이 없으면 유저를 생성하고 반환해야 함', async () => {
      // [가정] DB에서 이메일과 닉네임을 찾았는데 아무것도 없다 (null)
      // (findOne 대신 exists를 썼다면 false를 리턴하게 설정)
      mockAuthRepository.findOne.mockResolvedValue(null); 
      // 만약 코드에서 exists를 썼다면 아래 주석 해제
      // mockAuthRepository.exists.mockResolvedValue(false);

      // [가정] create는 dto 내용을 그대로 객체로 만듦
      mockAuthRepository.create.mockReturnValue({
        id: 1,
        ...dto,
        password: 'hashedPassword',
      });
      
      // [가정] save는 그냥 통과 (Promise<void>)
      mockAuthRepository.save.mockResolvedValue(undefined);

      // [실행]
      const result = await service.register(dto);

      // [검증]
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(dto.email);
      expect(mockAuthRepository.save).toHaveBeenCalledTimes(1); // save가 1번 호출됐는지
      expect(mockAuthRepository.create).toHaveBeenCalledTimes(1);
    });

    it('실패: 이메일이 중복되면 ConflictException을 던져야 함', async () => {
      // [가정] 이메일 조회했더니 이미 유저가 있다!
      mockAuthRepository.findOne.mockResolvedValueOnce({ email: dto.email });
      // mockAuthRepository.exists.mockResolvedValueOnce(true);

      // [실행 & 검증] 에러가 발생하는지 확인
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });
});