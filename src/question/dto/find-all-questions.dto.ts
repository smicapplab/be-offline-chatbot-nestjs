import { IsOptional, IsInt, Min, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllQuestionsDto {
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
    search: string; // search question

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    uploadId: number; // search question by upload_id
}