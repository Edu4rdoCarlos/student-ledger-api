import { Global, Module } from '@nestjs/common';
import { PrismaModule } from './prisma';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [],
  exports: [PrismaModule],
})
export class DatabaseModule {}
