import { Inject, Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class ActiveQueueGuard implements CanActivate {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    const eventId = request.body.eventId || request.params.eventId;

    if (!eventId) {
        throw new BadRequestException('대기열 검증을 위해 eventId가 필요합니다.');
      }

    const activeKey = `queue:active:${eventId}:${user.id}`;
    const isActive = await this.redisClient.get(activeKey);

    if (!isActive) {
      throw new HttpException(
        '대기열 입장권이 만료되었거나 유효하지 않습니다.',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}