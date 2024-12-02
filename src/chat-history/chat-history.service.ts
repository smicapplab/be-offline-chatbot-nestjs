import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { SearchQuestionDto } from 'src/question/dto/search-question.dto';
import { FindAllChatHistoryDto } from './dto/find-all-chat-history.dto';

// @steve: for POC, ignore types/interfaces here, will put them in folder later
type ChatResponse = {
    id?: string,
    question: string,
    answer: string,
    combinedSimilarity: number,
    textSimilarity: number,
    keywordMatchScore: number,
    finalScore: number,
}

@Injectable()
export class ChatHistoryService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async findAllClientTypes(): Promise<string[]> {
        const clientTypes = await this.prisma.chatHistory.findMany({
            distinct: ['clientType'],
            select: {
                clientType: true,
            },
        });

        return clientTypes.map((item) => item.clientType);
    }


    async updateHistory(searchQuestionDto: SearchQuestionDto, result: ChatResponse): Promise<void> {
        const { newMessage, userId = '', clientType = '' } = searchQuestionDto;
        const now = new Date();

        try {
            const existingChatHistory = await this.prisma.chatHistory.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });

            if (existingChatHistory) {
                const history = {
                    question: newMessage,
                    date: now.toISOString(),
                    ...result,
                };

                const updatedHistory = [
                    ...((existingChatHistory.history as any[]) ?? []),
                    history,
                ];

                await this.prisma.chatHistory.update({
                    where: { id: existingChatHistory.id },
                    data: {
                        history: updatedHistory,
                    },
                });
            } else {
                const history = [
                    {
                        question: newMessage,
                        date: now.toISOString(),
                        ...result,
                    },
                ];

                await this.prisma.chatHistory.create({
                    data: {
                        clientType,
                        userId,
                        history,
                    },
                });
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async findAll(dto: FindAllChatHistoryDto) {
        const {
            limit = 10,
            offset = 0,
            lastRecordId,
            fromDate,
            toDate,
            userId,
            clientType,
        } = dto;

        const where: Prisma.ChatHistoryWhereInput = {};
        if (userId) where.userId = userId;
        if (clientType) where.clientType = clientType;
        if (fromDate) where.createdAt = { gte: new Date(fromDate) };
        if (toDate) where.createdAt = { lte: new Date(toDate) };
        if (lastRecordId) where.id = { gt: lastRecordId };

        const [chatHistories, totalRecords] = await Promise.all([
            this.prisma.chatHistory.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.chatHistory.count({ where }),
        ]);

        const data = chatHistories.map((chat) => ({
            id: chat.id,
            clientType: chat.clientType,
            userId: chat.userId,
            history: chat.history,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
        }));

        const totalRemaining = Math.max(totalRecords - offset - limit, 0);

        return {
            data,
            totalRecords,
            totalRemaining,
        };
    }
}