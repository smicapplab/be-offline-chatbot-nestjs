import { Controller, Get, Post, Body, Patch, UseGuards, Request, Query } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SearchQuestionDto } from './dto/search-question.dto';
import { FindAllQuestionsDto } from './dto/find-all-questions.dto';
import { EditQuestionDto } from './dto/edit-question.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/auth/request-with-user.interface';

@Controller('questions')
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Query() dto: FindAllQuestionsDto) {
    return this.questionsService.findAll(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  create(@Body() createQuestionDto: CreateQuestionDto, @Request() req: RequestWithUser) {
    return this.questionsService.upload(createQuestionDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('search')
  search(@Body() searchQuestionDto: SearchQuestionDto) {
    return this.questionsService.search(searchQuestionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  async editQuestion(@Body() dto: EditQuestionDto, @Request() req: RequestWithUser) {
    return this.questionsService.editQuestion(dto, req.user);
  }

  //editQuestion
}
