import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse';
import * as pako from 'pako';
import { PrismaService } from 'prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { EditQuestionDto } from './dto/edit-question.dto';
import { FindAllQuestionsDto } from './dto/find-all-questions.dto';
import { SearchQuestionDto } from './dto/search-question.dto';

interface QuestionResult {
  id: number;
  questionText: string;
  answerText: string;
  similarity: number;
  textSimilarity: number;
  finalScore?: number;
}

@Injectable()
export class QuestionsService {
  
  private model;

  constructor(
    private readonly prisma: PrismaService,
  ) {
    this.initializeModel();
  }

  private async initializeModel() {
    //@ts-ignore
    const TransformersApi = Function('return import("@xenova/transformers")')();
    const { pipeline, env } = await TransformersApi;
    const embeddingModelName = 'Xenova/all-mpnet-base-v2';
    env.allowRemoteModels = true;

    try {
      // Initialize the embedding model
      this.model = await pipeline('feature-extraction', embeddingModelName);
    } catch (error) {
      console.error('Error initializing models:', error);
      throw error;
    }
  }

  public async generateEmbedding(question: string, answer: string): Promise<number[]> {
    const combinedText = `${question} [SEP] ${answer}`;
    const result = await this.model(combinedText, { pooling: 'mean', normalize: true });
    return Array.from(result.data);
  }

  async search(searchQuestionDto: SearchQuestionDto) {
    const { messages, newMessage, userId, lang } = searchQuestionDto;

    const context = messages?.length
      ? messages.map((msg) => msg.content).join(' [SEP] ')
      : '';

    const contextEmbedding = context ? await this.generateEmbedding(context, '') : [];
    const newMessageEmbedding = await this.generateEmbedding(newMessage, '');

    const keywords = newMessage.match(/\b\w{4,}\b/g) || [];

    const questions = await this.prisma.$queryRawUnsafe<QuestionResult[]>(`
      SELECT id, question_text AS questionText, answer_text AS answerText,
             1 - (embedding <=> ARRAY[${newMessageEmbedding.join(', ')}]) AS similarity,
             GREATEST(similarity(lower(question_text), lower($1)), similarity(lower(answer_text), lower($1))) AS textSimilarity
      FROM questions
      ${lang ? `WHERE lang = '${lang}'` : ''}
      ORDER BY similarity DESC, textSimilarity DESC
      LIMIT 20;
    `, newMessage);

    // Post-process results
    const results = questions.map((result: any) => {
      const containsAllKeywords = keywords.every((kw) =>
        result.question.toLowerCase().includes(kw.toLowerCase()),
      );
      const keywordBoost = containsAllKeywords ? 0.5 : 0.0;

      return {
        ...result,
        finalScore: result.similarity * 0.7 + result.textSimilarity * 0.3 + keywordBoost,
      };
    });

    results.sort((a, b) => b.finalScore - a.finalScore);

    const nearestAnswer = results.length && results[0].finalScore >= 0.4
      ? results[0]
      : {
          id: null,
          question: newMessage,
          answerText: 'No relevant information found.',
          similarity: 0,
          textSimilarity: 0,
          finalScore: 0,
        };

    // if (userId) { //maybe use event driven for this
    //   this.chatHistoryService.updateHistory(searchQuestionDto, nearestAnswer);
    // }

    return nearestAnswer;
  }

  async upload(createQuestionDto: CreateQuestionDto, user: any) {
    const { data, fileName } = createQuestionDto;
    const compressedBinary = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const binaryData = pako.inflate(compressedBinary);

    const uploadHistory = await this.prisma.uploadHistory.create({
      data: {
        fileName,
        uploadedBy: user.sub,
        status: 'Pending',
      },
    });

    setImmediate(async () => {
      try {
        await this.processCsvDataInBackground(binaryData, uploadHistory.id, user.sub);
        await this.prisma.uploadHistory.update({
          where: { id: uploadHistory.id },
          data: { status: 'Done' },
        });
      } catch (error) {
        console.error('Error processing CSV:', error.message);
        await this.prisma.uploadHistory.update({
          where: { id: uploadHistory.id },
          data: { status: 'Failed' },
        });
      }
    });

    return { message: 'CSV uploaded successfully. Processing in the background.' };
  }

  async processCsvDataInBackground(data: Uint8Array, uploadHistoryId: number, userId: number) {
    const csvBuffer = Buffer.from(data);
    const parser = parse(csvBuffer, {
      columns: true,
      skip_empty_lines: true,
    });

    for await (const record of parser) {
      const { question, answer } = record;

      if (question && answer) {
        const lang = await this.detectLanguage(question);
        const embedding = await this.generateEmbedding(question, answer);

        await this.prisma.question.create({
          data: {
            question: question,
            answer: answer,
            lang: lang === 'tgl' ? 'tgl' : 'eng',
            embedding,
            uploadId: uploadHistoryId,
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }
    }
  }

  async findAll(dto: FindAllQuestionsDto) {
    const { limit = 10, offset = 0, search, uploadId } = dto;

    const where: any = {};
    if (search) {
      where.OR = [
        { questionText: { contains: search, mode: 'insensitive' } },
        { answerText: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (uploadId) where.uploadId = uploadId;

    const [questions, totalRecords] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip: offset,
        take: limit,
        include: { upload: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      data: questions,
      totalRecords,
      totalRemaining: Math.max(totalRecords - offset - limit, 0),
    };
  }

  async editQuestion(dto: EditQuestionDto, user: any) {
    const { id, question, answer } = dto;
    const embedding = await this.generateEmbedding(question, answer);
    const lang = await this.detectLanguage(question);

    await this.prisma.question.update({
      where: { id },
      data: {
        question: question,
        answer: answer,
        lang: lang === 'tgl' ? 'tgl' : 'eng',
        embedding,
        updatedBy: user.id,
      },
    });

    return { id, question, answer, embedding };
  }

  async detectLanguage(text: string) {
    const FrancMin = Function('return import("franc-min")')();
    const { franc } = await FrancMin;
    return franc(text);
  }
}