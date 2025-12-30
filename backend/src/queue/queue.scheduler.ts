import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueueService } from './queue.service';

@Injectable()
export class QueueScheduler {
  constructor(private readonly queueService: QueueService) {}

  // 1초마다 실행
  @Cron(CronExpression.EVERY_SECOND)
  async handleCron() {
    const ALLOW_COUNT = 10; 
    // console.log(`${ALLOW_COUNT}명을 대기열에서 허용합니다.`);
    await this.queueService.allowEntrance(ALLOW_COUNT);
  }
}