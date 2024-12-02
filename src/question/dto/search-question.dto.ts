import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

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