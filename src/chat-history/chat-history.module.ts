import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaModule } from 'prisma/prisma.module';
import { ChatHistoryController } from './chat-history.controller';
import { ChatHistoryService } from './chat-history.service';

@Module({
  imports: [
    PrismaModule
  ],
  providers: [ChatHistoryService, JwtService],
  controllers: [ChatHistoryController]
})

export class ChatHistoryModule { }