import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaModule } from 'prisma/prisma.module';
import { ChatHistoryService } from 'src/chat-history/chat-history.service';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';


@Module({
  imports: [
    PrismaModule,
    ConfigModule,
  ],
  providers: [QuestionsService, ChatHistoryService, JwtService],
  controllers: [QuestionsController],
})

export class QuestionsModule { }