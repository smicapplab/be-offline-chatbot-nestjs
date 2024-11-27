import { Module } from '@nestjs/common';
import { UploadHistoryService } from './upload-history.service';
import { UploadHistoryController } from './upload-history.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule,

  ],
  providers: [UploadHistoryService, JwtService],
  controllers: [UploadHistoryController],
})
export class UploadHistoryModule { }
