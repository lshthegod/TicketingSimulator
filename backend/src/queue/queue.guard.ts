import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class ActiveQueueGuard implements CanActivate {
  private readonly redisClient: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST') || 'localhost',
      port: this.configService.get<number>('REDIS_PORT') || 6379,
    });
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