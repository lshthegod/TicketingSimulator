import { Controller, Get, Res, Render } from '@nestjs/common';
import { AppService } from './app.service';
import { join } from 'path';
import type { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  home(): { message: string } {
    return { message: 'NestJS로 만든 화면입니다.' };
  }

  @Get('start')
  startWeb(@Res() res: Response): void {
    res.sendFile(join(process.cwd(), 'public/start.html'));
  }
}
