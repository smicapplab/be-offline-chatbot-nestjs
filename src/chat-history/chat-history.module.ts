import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatHistoryController } from './chat-history.controller';
import { ChatHistoryService } from './chat-history.service';

@Module({
  imports: [
  ],
  providers: [ChatHistoryService, JwtService],
  controllers: [ChatHistoryController]
})

export class ChatHistoryModule { }