import { Global, Module } from '@nestjs/common';
import { PrismaModule } from './prisma';
import { MongoStorageService } from './mongo';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [MongoStorageService],
  exports: [PrismaModule, MongoStorageService],
})
export class DatabaseModule {}
