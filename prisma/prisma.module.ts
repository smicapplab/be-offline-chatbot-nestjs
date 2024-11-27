import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Makes PrismaService available globally in the app
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}