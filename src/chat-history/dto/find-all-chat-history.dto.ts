// src/upload-history/dto/find-all-upload-history.dto.ts
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class FindAllChatHistoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10; 

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  lastRecordId: number;

  @IsOptional()
  @IsDateString()
  fromDate: string; 

  @IsOptional()
  @IsDateString()
  toDate: string; 

  @IsOptional()
  @IsString()
  userId: string; 

  @IsOptional()
  @IsString()
  clientType: string; 
}