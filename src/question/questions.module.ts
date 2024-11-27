import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';


@Module({
  imports: [
    PrismaModule,
    ConfigModule,
  ],
  providers: [QuestionsService, JwtService],
  controllers: [QuestionsController],
})

export class QuestionsModule { }