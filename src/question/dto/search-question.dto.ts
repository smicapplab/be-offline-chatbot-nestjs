import { IsString, IsNotEmpty, IsArray, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class Message {
    @IsString()
    role: string;

    @IsString()
    content: string;
}

export class SearchQuestionDto {

    @IsString()
    @IsOptional()
    lang?: string;

    @IsString()
    @IsOptional()
    userId?: string;

    @IsString()
    @IsOptional()
    clientType?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @IsOptional()
    @Type(() => Message)
    messages?: Message[];

    @IsString()
    @IsNotEmpty()
    newMessage: string;
}