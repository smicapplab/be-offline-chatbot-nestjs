import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaModule } from 'prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { QuestionsController } from './question/questions.controller';
import { QuestionsModule } from './question/questions.module';
import { QuestionsService } from './question/questions.service';
import { UploadHistoryController } from './upload-history/upload-history.controller';
import { UploadHistoryModule } from './upload-history/upload-history.module';
import { UploadHistoryService } from './upload-history/upload-history.service';

@Module({
  imports: [
    PrismaModule,
    QuestionsModule,
    UploadHistoryModule,
    ConfigModule.forRoot({
      isGlobal: true,
    })],
  controllers: [
    AppController,
    QuestionsController,
    UploadHistoryController],
  providers: [
    AppService,
    QuestionsService,
    UploadHistoryService,
    JwtService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Make JwtAuthGuard global
    },],
})
export class AppModule { }
