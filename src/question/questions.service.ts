import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { parse } from 'csv-parse';
import * as pako from 'pako';
import { PrismaService } from 'prisma/prisma.service';
import { RequestWithUser } from 'src/auth/request-with-user.interface';
import { ChatHistoryService } from 'src/chat-history/chat-history.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { EditQuestionDto } from './dto/edit-question.dto';
import { FindAllQuestionsDto } from './dto/find-all-questions.dto';
import { SearchQuestionDto } from './dto/search-question.dto';

interface QuestionResult {
  id: string;
  question: string;
  answer: string;
  combinedSimilarity: string; // Raw SQL returns these values as strings
  textSimilarity: string;     // Change this to string
  keywordMatchScore: string;  // Change this to string
}

@Injectable()
export class QuestionsService {

  private model: (arg0: string, arg1: { pooling: string; normalize: boolean; }) => any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatHistoryService: ChatHistoryService
  ) {
    this.initializeModel();
  }

  private async initializeModel() {
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

  // Helper function to calculate cosine distance between two embeddings
  private calculateCosineDistance(embeddingA: number[], embeddingB: number[]): number {
    const dotProduct = embeddingA.reduce((sum, a, idx) => sum + a * embeddingB[idx], 0);
    const magnitudeA = Math.sqrt(embeddingA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(embeddingB.reduce((sum, b) => sum + b * b, 0));
    return 1 - dotProduct / (magnitudeA * magnitudeB);
  }


  async search(searchQuestionDto: SearchQuestionDto) {
    const { messages, newMessage, userId, lang } = searchQuestionDto;

    // Generate context from previous messages if available
    const context = messages?.length
      ? messages.map((msg) => msg.content).join(' [SEP] ')
      : '';

    // Generate embeddings for context and new message
    const contextEmbedding = context ? await this.generateEmbedding(context, '') : [];
    const newMessageEmbedding = await this.generateEmbedding(newMessage, '');

    // Calculate similarity between context and new message
    const contextSimilarity = contextEmbedding.length > 0
      ? 1 - this.calculateCosineDistance(contextEmbedding, newMessageEmbedding)
      : 0;

    // Context inclusion threshold
    const CONTEXT_THRESHOLD = 0.5;
    const useContext = contextSimilarity >= CONTEXT_THRESHOLD;

    // Extract meaningful keywords from the new message
    const keywords = newMessage.match(/\b\w{4,}\b/g) || [];

    // Build embeddings as PostgreSQL-compatible arrays
    const contextEmbeddingString = useContext && contextEmbedding.length > 0
      ? `ARRAY[${contextEmbedding.join(', ')}]::vector(768)`
      : null;
    const newMessageEmbeddingString = `ARRAY[${newMessageEmbedding.join(', ')}]::vector(768)`;

    // Construct query conditionally based on context usage
    const query = `
      SELECT id, question_text AS "question", answer_text AS "answerText",
             ${useContext
        ? `0.7 * (1 - (embedding <=> ${newMessageEmbeddingString})) +
                  0.3 * (1 - (embedding <=> ${contextEmbeddingString}))`
        : `1 - (embedding <=> ${newMessageEmbeddingString})`}
             AS "combinedSimilarity",
             GREATEST(similarity(lower(question_text), lower($1)), similarity(lower(answer_text), lower($1))) AS "textSimilarity",
             CAST(
               CASE
                 WHEN lower(question_text) ~* $2 THEN 0.2
                 ELSE 0
               END AS NUMERIC
             ) AS "keywordMatchScore"
      FROM questions
      ${lang ? `WHERE lang = '${lang}'` : ''}
      ORDER BY "combinedSimilarity" DESC, "textSimilarity" DESC
      LIMIT 20;
    `;

    const params = [newMessage, keywords.join('|')];

    // Execute the raw query
    const questions = await this.prisma.$queryRawUnsafe<QuestionResult[]>(query, ...params);

    // Adjust final scores
    const results = questions.map((result) => {
      const containsAllKeywords = keywords.every((kw) =>
        result.question.toLowerCase().includes(kw.toLowerCase())
      );
      const keywordBoost = containsAllKeywords ? 0.5 : 0.0;

      return {
        ...result,
        combinedSimilarity: parseFloat(result.combinedSimilarity),
        textSimilarity: parseFloat(result.textSimilarity),
        keywordMatchScore: parseFloat(result.keywordMatchScore),
        finalScore:
          parseFloat(result.combinedSimilarity) +
          parseFloat(result.textSimilarity) * 0.5 +
          parseFloat(result.keywordMatchScore) +
          keywordBoost,
      };
    });

    // Sort by final score
    results.sort((a, b) => b.finalScore - a.finalScore);

    // Determine the nearest answer
    const nearestAnswer =
      results.length && results[0].finalScore >= 0.4
        ? results[0]
        : {
          id: null,
          question: newMessage,
          answer: 'No relevant information found.',
          combinedSimilarity: 0,
          textSimilarity: 0,
          keywordMatchScore: 0,
          finalScore: 0,
        };

    // Optionally update the chat history
    if (userId) {
      this.chatHistoryService.updateHistory(searchQuestionDto, nearestAnswer);
    }

    return nearestAnswer;
  }

  async upload(createQuestionDto: CreateQuestionDto, user: RequestWithUser['user'] ) {
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

    const where: Prisma.QuestionWhereInput = {};
    if (search) {
      where.OR = [
        { question: { contains: search, mode: 'insensitive' } },
        { answer: { contains: search, mode: 'insensitive' } },
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

  async editQuestion(dto: EditQuestionDto, user: RequestWithUser['user']) {
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
        updatedBy: user.sub,
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