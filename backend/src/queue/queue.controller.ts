import { Controller, Get, Post, UseGuards, Request, Param } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ActiveQueueGuard } from './queue.guard';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}
  
  @UseGuards(JwtAuthGuard)
  @Post('enter/:eventId')
  async enter(@Param('eventId') eventId: string, @Request() req) {
    await this.queueService.enterQueue(eventId, req.user.id);
    return { message: '대기열 진입 완료' };
  }

  @UseGuards(JwtAuthGuard, ActiveQueueGuard)
  @Post('leave/:eventId')
  async leave(@Param('eventId') eventId: string, @Request() req) {
    await this.queueService.leaveQueue(eventId, req.user.id);
    return { message: '대기열 이탈 완료' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('status/:eventId')
  async status(@Param('eventId') eventId: string, @Request() req) {
    return await this.queueService.getMyRank(eventId, req.user.id);
  }
}
