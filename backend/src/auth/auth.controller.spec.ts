import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// 1. 가짜 AuthService 만들기
// 컨트롤러가 사용하는 함수들(register, login)만 흉내 냅니다.
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      // 👇 2. 여기가 핵심! 컨트롤러가 일할 때 필요한 가짜 서비스를 제공(provide)해야 합니다.
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // 👇 추가적인 테스트 예시: "컨트롤러가 서비스를 잘 호출하는가?"
  describe('register', () => {
    it('should call authService.register with the dto', async () => {
      const dto = { email: 'a@a.com', nickname: 'a', password: '123' };
      
      // 가짜 서비스가 성공했다고 가정
      mockAuthService.register.mockResolvedValue({ id: 1, ...dto });

      await controller.register(dto);

      // 검증: 서비스의 register 함수가 정확히 호출되었는지 확인
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });
  });
});