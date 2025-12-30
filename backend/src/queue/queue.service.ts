import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class QueueService {
  private readonly redisClient: Redis;
  private readonly WAITING_KEY = 'queue:waiting';
  private readonly ACTIVE_KEY_PREFIX = 'queue:active:';

  constructor() {
    this.redisClient = new Redis({
      host: 'localhost',
      port: 6379,
    });
  }

  async enterQueue(userId: number) {
    const timestamp = Date.now();
    const result = await this.redisClient.zadd(this.WAITING_KEY, timestamp, userId.toString());
    return result;
  }

  async getMyRank(userId: number) {
    const isActive = await this.redisClient.get(`${this.ACTIVE_KEY_PREFIX}${userId}`);
    if (isActive) {
      return { status: 'ACTIVE', rank: 0 };
    }

    const rank = await this.redisClient.zrank(this.WAITING_KEY, userId.toString());

    if (rank === null) {
      return { status: 'NOT_IN_QUEUE', rank: -1 };
    }

    return { status: 'WAITING', rank: rank + 1 };
  }

  async allowEntrance(count: number) {
    const users = await this.redisClient.zpopmin(this.WAITING_KEY, count);

    if (users.length === 0) return;

    const pipeline = this.redisClient.pipeline();
    for (let i = 0; i < users.length; i += 2) {
      const userId = users[i];
      pipeline.set(`${this.ACTIVE_KEY_PREFIX}${userId}`, 'true', 'EX', 300);
    }

    await pipeline.exec();
  }
}