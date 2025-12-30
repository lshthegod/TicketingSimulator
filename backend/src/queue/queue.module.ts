import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { QueueScheduler } from './queue.scheduler';

@Module({
  controllers: [QueueController],
  providers: [QueueService, QueueScheduler],
})
export class QueueModule {}
