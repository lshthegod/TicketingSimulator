import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueueService } from './queue.service';

@Injectable()
export class QueueScheduler {
  constructor(private readonly queueService: QueueService) {}

  // 1초마다 실행
  @Cron(CronExpression.EVERY_SECOND)
  async handleCron() {
    const eventIds = await this.queueService.getActiveEventIds();
    const ALLOW_COUNT = 10; 
    
    await Promise.all(
      eventIds.map(eventId => this.queueService.allowEntrance(eventId, ALLOW_COUNT))
    );
  }
}