import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JoinSessionDto } from './dto/join-session.dto';

@Controller()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('rooms/:roomId/sessions')
  create(@Param('roomId') roomId: string, @Body() dto: CreateSessionDto) {
    return this.sessionsService.create(roomId, dto);
  }

  @Get('sessions/:id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Post('sessions/:id/join')
  join(@Param('id') id: string, @Body() dto: JoinSessionDto) {
    return this.sessionsService.join(id, dto);
  }

  @Post('sessions/:id/settle')
  settle(@Param('id') id: string) {
    return this.sessionsService.settle(id);
  }
}
