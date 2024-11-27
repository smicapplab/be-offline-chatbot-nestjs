// src/upload-history/dto/find-all-upload-history.dto.ts
import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllUploadHistoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10; // Default limit is 10

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
  @IsString()
  search: string; // Optional search filter by file name
}