import { Controller, Get, Res, Render } from '@nestjs/common';
import { EventsService } from './events/events.service';

@Controller()
export class AppController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @Render('index')
  async home() {
    const events = await this.eventsService.findAllByOpenAtAsc();
    return { events };
  }
}
