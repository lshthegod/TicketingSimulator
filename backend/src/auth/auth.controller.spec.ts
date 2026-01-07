import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  // Response 객체 Mocking
  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    redirect: jest.fn(),
  } as unknown as Response;

  // AuthService Mocking
  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    guest: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks(); // 각 테스트 전 Mock 초기화
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('회원가입 성공 시 결과를 반환해야 함', async () => {
      const dto = { email: 'test@example.com', password: 'password', nickname: 'test' };
      const expectedResult = { id: 1, ...dto };
      
      jest.spyOn(authService, 'register').mockResolvedValue(expectedResult as any);

      const result = await controller.register(dto);
      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('로그인 성공 시 쿠키를 설정하고 리다이렉트해야 함', async () => {
      const dto = { email: 'test@example.com', password: 'password' };
      const tokenResult = { accessToken: 'test_token', message: '로그인 성공' };

      jest.spyOn(authService, 'login').mockResolvedValue(tokenResult);

      await controller.login(dto, mockResponse);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        tokenResult.accessToken,
        { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith('/');
    });
  });

  describe('guest', () => {
    it('게스트 로그인 시 쿠키를 설정하고 리다이렉트해야 함', async () => {
      const tokenResult = { accessToken: 'guest_token', message: '게스트 로그인 성공' };

      jest.spyOn(authService, 'guest').mockResolvedValue(tokenResult);

      await controller.guest(mockResponse);

      expect(authService.guest).toHaveBeenCalled();
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        tokenResult.accessToken,
        expect.any(Object),
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith('/');
    });
  });

  describe('me', () => {
    it('현재 유저 정보를 반환해야 함', async () => {
      const user = { id: 1, email: 'test@example.com' };
      const result = await controller.me(user);
      expect(result).toEqual(user);
    });
  });

  describe('logout', () => {
    it('로그아웃 시 쿠키를 제거하고 리다이렉트해야 함', async () => {
      await controller.logout(mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken');
      expect(mockResponse.redirect).toHaveBeenCalledWith('/');
    });
  });
});