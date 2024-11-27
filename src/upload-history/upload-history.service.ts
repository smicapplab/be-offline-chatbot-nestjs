import { Injectable } from '@nestjs/common';
import { FindAllUploadHistoryDto } from './dto/find-all-upload-history.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UploadHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: FindAllUploadHistoryDto) {
    const { limit = 10, offset = 0, lastRecordId, search } = dto;

    // Base query
    const where: any = {};
    if (search) {
      where.fileName = { contains: search, mode: 'insensitive' };
    }
    if (lastRecordId) {
      where.id = { gt: lastRecordId };
    }

    // Fetch uploads with pagination and questions count
    const uploads = await this.prisma.uploadHistory.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { uploadedAt: 'desc' },
      include: {
        _count: {
          select: { questions: true }, // Count associated questions
        },
      },
    });

    // Fetch total records
    const totalRecords = await this.prisma.uploadHistory.count({ where });

    // Map the results to the desired format
    const data = uploads.map((upload) => ({
      id: upload.id,
      fileName: upload.fileName,
      questionCount: upload._count.questions,
      uploadedAt: upload.uploadedAt,
      status: upload.status,
    }));

    const totalRemaining = Math.max(totalRecords - offset - limit, 0);

    return {
      data,
      totalRecords,
      totalRemaining,
    };
  }

  async deleteById(id: number): Promise<boolean> {
    const result = await this.prisma.uploadHistory.delete({
      where: { id },
    });
    return !!result; // Return true if the record was deleted
  }

  async findAllUploadName() {
    const uploads = await this.prisma.uploadHistory.findMany({
      select: {
        id: true,
        fileName: true,
      },
      orderBy: {
        fileName: 'asc',
      },
    });

    return uploads;
  }
}