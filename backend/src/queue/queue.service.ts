import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class QueueService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {
  }

  private getWaitingKey(eventId: string) {
    return `queue:waiting:${eventId}`;
  }

  private getActiveKey(eventId: string, userId: number) {
    return `queue:active:${eventId}:${userId}`;
  }

  async enterQueue(eventId: string, userId: number) {
    const timestamp = Date.now();
    const result = await this.redisClient.zadd(this.getWaitingKey(eventId), timestamp, userId.toString());
    return result;
  }

  async leaveQueue(eventId: string, userId: number) {
    const waitingKey = this.getWaitingKey(eventId);
    const activeKey = this.getActiveKey(eventId, userId);

    const pipeline = this.redisClient.pipeline();
    pipeline.zrem(waitingKey, userId.toString());
    pipeline.del(activeKey);
    await pipeline.exec();
  }

  async getMyRank(eventId: string, userId: number) {
    const activeKey = this.getActiveKey(eventId, userId);
    const waitingKey = this.getWaitingKey(eventId);

    const isActive = await this.redisClient.get(activeKey);
    if (isActive) {
      return { status: 'ACTIVE', rank: 0 };
    }

    const rank = await this.redisClient.zrank(waitingKey, userId.toString());

    if (rank === null) {
      return { status: 'NOT_IN_QUEUE', rank: -1 };
    }

    return { status: 'WAITING', rank: rank + 1 };
  }

  async allowEntrance(eventId: string, count: number) {
    const waitingKey = this.getWaitingKey(eventId);

    const users = await this.redisClient.zpopmin(waitingKey, count);
    if (users.length === 0) return;

    const pipeline = this.redisClient.pipeline();
    for (let i = 0; i < users.length; i += 2) {
      const userId = users[i];
      const activeKey = this.getActiveKey(eventId, Number(userId));

      pipeline.set(activeKey, 'true', 'EX', 300);
    }
    await pipeline.exec();
  }

  async getActiveEventIds(): Promise<string[]> {
    const keys = await this.redisClient.keys('queue:waiting:*');
    return keys.map(key => key.split(':').pop() || '');
  }
}