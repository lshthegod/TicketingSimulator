import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            // 'JWT_SECRET'을 요청하면 테스트용 키를 반환하도록 모킹
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test_secret_key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('토큰 페이로드를 받아 유효한 유저 객체를 반환해야 함', async () => {
      // JWT 토큰이 해독된 상태라고 가정한 페이로드
      const payload = {
        id: 1,
        email: 'test@example.com',
        nickname: 'tester',
        iat: 1672531200, // issued at (발급 시각)
        exp: 1672617600, // expiration (만료 시각)
      };

      const result = await strategy.validate(payload);

      // 반환값 검증: iat, exp 등은 제외하고 필요한 필드만 남았는지 확인
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        nickname: 'tester',
      });
    });
  });
});