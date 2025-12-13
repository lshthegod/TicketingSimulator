import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

// user 타입 정의
interface RequestWithUser extends Request {
  user?: any;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  use(req: RequestWithUser, res: Response, next: NextFunction) {
    const token = req.cookies.accessToken;

    if (!token) {
      res.locals.user = null;
      res.locals.isLoggedIn = false;
      return next();
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const decoded = this.jwtService.verify(token, { secret });

      req.user = decoded;
      res.locals.user = decoded;
      res.locals.isLoggedIn = true;
    } catch (error) {
      console.error(error);
      res.clearCookie('accessToken');
      res.locals.user = null;
      res.locals.isLoggedIn = false;
    }
    
    next();
  }
}
