import { Module } from '@nestjs/common';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { QueueScheduler } from './queue.scheduler';

@Module({
  controllers: [QueueController],
  providers: [QueueService, QueueScheduler],
})
export class QueueModule {}
