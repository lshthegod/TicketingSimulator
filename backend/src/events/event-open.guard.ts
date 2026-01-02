import { CanActivate, ExecutionContext, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { EventEntity } from 'src/events/entities/event.entity';

@Injectable()
export class EventOpenGuard implements CanActivate {
  private readonly redisClient: Redis;

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST') || 'localhost',
      port: this.configService.get<number>('REDIS_PORT') || 6379,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const eventId = request.params?.eventId ?? request.body?.eventId;

    if (!eventId) {
      return true;
    }

    let openAtString = await this.redisClient.get(`event:${eventId}:openAt`);

    if (!openAtString) {
      const event = await this.dataSource.manager.findOne(EventEntity, {
        where: { id: eventId },
        select: ['openAt'],
      });

      if (!event) {
        throw new NotFoundException('공연 정보가 없습니다.');
      }

      openAtString = event.openAt.toISOString();

      await this.redisClient.set(`event:${eventId}:openAt`, openAtString, 'EX', 3600);
    }

    const openAt = new Date(openAtString);
    const now = new Date();

    if (now < openAt) {
      throw new ForbiddenException(
        `티켓 예매는 ${openAt.toLocaleString()}부터 가능합니다.`,
      );
    }

    return true;
  }
}
