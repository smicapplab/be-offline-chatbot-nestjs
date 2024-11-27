import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChatHistoryService } from './chat-history.service';
import { FindAllChatHistoryDto } from './dto/find-all-chat-history.dto';

@Controller('chat-history')
export class ChatHistoryController {

    constructor(private readonly chatHistoryService: ChatHistoryService) {}

    @UseGuards(JwtAuthGuard)
    @Get('client-type')
    async findAllUploadName() {
        return await this.chatHistoryService.findAllClientTypes();
    }

    //@UseGuards(JwtAuthGuard)
    @Get()
    async findAll(@Query() dto: FindAllChatHistoryDto) {
        return await this.chatHistoryService.findAll(dto);
    }

}
