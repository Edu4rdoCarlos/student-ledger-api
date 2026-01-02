import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { APP_GUARD } from '@nestjs/core';

// Shared
import { PrismaModule, JwtAuthGuard, RolesGuard } from './shared/infra';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { StudentsModule } from './modules/students/students.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { FabricModule } from './modules/fabric/fabric.module';
import { IpfsModule } from './modules/ipfs/ipfs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    // Shared
    PrismaModule,

    // Feature Modules
    AuthModule,
    StudentsModule,
    DocumentsModule,
    FabricModule,
    IpfsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
