import { AuthMiddleware } from './auth.middleware';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

// 1. 가짜 객체 정의
const mockJwtService = {
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('test-secret-key'), // ConfigService가 'test-secret-key'를 반환한다고 가정
};

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks(); // 이전 테스트 기록 초기화

    middleware = new AuthMiddleware(
      mockJwtService as unknown as JwtService,
      mockConfigService as unknown as ConfigService,
    );

    // Request 객체 초기화
    req = {
      cookies: {},
    };

    // Response 객체 초기화
    res = {
      locals: {},
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    // Next 함수 초기화
    next = jest.fn();

    // console.error가 테스트 화면을 더럽히지 않게 막음 (선택 사항)
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    it('시나리오 1: 토큰(accessToken)이 없으면 -> 게스트로 통과', () => {
      // [상황] 쿠키가 비어있음
      req.cookies = {};

      // [실행]
      middleware.use(req as Request, res as Response, next);

      // [검증]
      expect(res.locals.user).toBeNull();
      expect(res.locals.isLoggedIn).toBe(false);
      expect(next).toHaveBeenCalled(); // 다음으로 진행
    });

    it('시나리오 2: 토큰이 유효하면 -> 유저 정보를 주입하고 통과', () => {
      // [상황] 유효한 accessToken이 있음
      const token = 'valid.token.string';
      const decodedUser = { id: 1, email: 'test@test.com' };

      req.cookies = { accessToken: token }; // 👈 여기가 중요! (이름 맞춤)

      // verify가 성공해서 유저 정보를 리턴한다고 가정
      mockJwtService.verify.mockReturnValue(decodedUser);

      // [실행]
      middleware.use(req as Request, res as Response, next);

      // [검증]
      // 1. ConfigService에서 시크릿 키를 가져왔는지?
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
      
      // 2. verify가 올바른 토큰과 시크릿 키로 호출되었는지?
      expect(mockJwtService.verify).toHaveBeenCalledWith(token, { secret: 'test-secret-key' });
      
      // 3. 결과가 잘 주입되었는지?
      expect(req['user']).toEqual(decodedUser);
      expect(res.locals.user).toEqual(decodedUser);
      expect(res.locals.isLoggedIn).toBe(true);
      expect(next).toHaveBeenCalled();
    });

    it('시나리오 3: 토큰이 만료/조작되었으면 -> 쿠키 삭제 및 게스트 처리', () => {
      // [상황] 이상한 토큰이 들어옴
      req.cookies = { accessToken: 'invalid.token' };

      // verify 실행 시 에러 발생시킴
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      // [실행]
      middleware.use(req as Request, res as Response, next);

      // [검증]
      // 에러가 났으니 쿠키를 지워야 함 (이름: accessToken)
      expect(res.clearCookie).toHaveBeenCalledWith('accessToken');
      
      expect(res.locals.user).toBeNull();
      expect(res.locals.isLoggedIn).toBe(false);
      expect(next).toHaveBeenCalled(); // 에러가 나도 서버는 계속 돌아야 함
    });
  });
});