import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class ActiveQueueGuard implements CanActivate {
  private readonly redisClient: Redis;

  constructor() {
    this.redisClient = new Redis({ host: 'localhost', port: 6379 });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    const isActive = await this.redisClient.get(`queue:active:${user.id}`);

    if (!isActive) {
      throw new HttpException(
        '대기열을 통과하지 않은 유저입니다.',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}