import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class EditQuestionDto {
    
    @IsInt()
    @IsNotEmpty()
    id: number;

    @IsString()
    @IsNotEmpty()
    question: string;

    @IsString()
    @IsNotEmpty()
    answer: string;
}