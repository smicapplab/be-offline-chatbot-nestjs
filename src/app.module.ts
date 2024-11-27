import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuestionsController } from './question/questions.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { QuestionsModule } from './question/questions.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QuestionsService } from './question/questions.service';
import { UploadHistoryController } from './upload-history/upload-history.controller';
import { UploadHistoryService } from './upload-history/upload-history.service';
import { UploadHistoryModule } from './upload-history/upload-history.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    QuestionsModule,
    UploadHistoryModule,
    ConfigModule.forRoot({
      isGlobal: true,
    })],
  controllers: [AppController, QuestionsController, UploadHistoryController],
  providers: [AppService, QuestionsService, UploadHistoryService, JwtService,{
    provide: APP_GUARD,
    useClass: JwtAuthGuard, // Make JwtAuthGuard global
  },],
})
export class AppModule { }
