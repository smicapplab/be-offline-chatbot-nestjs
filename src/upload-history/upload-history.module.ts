import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UploadHistoryController } from './upload-history.controller';
import { UploadHistoryService } from './upload-history.service';

@Module({
  imports: [
    ConfigModule,
  ],
  providers: [UploadHistoryService, JwtService],
  controllers: [UploadHistoryController],
})
export class UploadHistoryModule { }
