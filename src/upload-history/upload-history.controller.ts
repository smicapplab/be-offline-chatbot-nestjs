import { Controller, Delete, Get, HttpCode, NotFoundException, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { UploadHistoryService } from './upload-history.service';
import { FindAllUploadHistoryDto } from './dto/find-all-upload-history.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('upload-history')
export class UploadHistoryController {

  constructor(private readonly uploadHistoryService: UploadHistoryService) {}

  @UseGuards(JwtAuthGuard)
  @Get('name')
  async findAllUploadName() {
    return await this.uploadHistoryService.findAllUploadName();
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Query() dto: FindAllUploadHistoryDto) {
    return await this.uploadHistoryService.findAll(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204) // Return HTTP 204 No Content by default
  async deleteUploadHistory(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const isDeleted = await this.uploadHistoryService.deleteById(id);
    if (!isDeleted) {
      throw new NotFoundException(`Upload history with ID ${id} not found`);
    }
  }
}
