import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}
  
  @UseGuards(JwtAuthGuard)
  @Post('enter')
  async enter(@Request() req) {
    await this.queueService.enterQueue(req.user.id);
    return { message: '대기열 진입 완료' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async status(@Request() req) {
    return await this.queueService.getMyRank(req.user.id);
  }
}
