import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Shared
import { JwtAuthGuard, RolesGuard } from './shared';
import { DatabaseModule } from './database';

// Core Modules
import { AuthModule } from './core/modules/auth/auth.module';
import { UserModule } from './core/modules/user/user.module';
import { StudentsModule } from './core/modules/students/students.module';
import { AdvisorsModule } from './core/modules/advisors/advisors.module';
import { CoordinatorsModule } from './core/modules/coordinators/coordinators.module';
import { CoursesModule } from './core/modules/courses/courses.module';
import { DefensesModule } from './core/modules/defenses/defenses.module';
import { DocumentsModule } from './core/modules/documents/documents.module';
import { ApprovalsModule } from './core/modules/approvals/approvals.module';

// Toolkit
import { FabricModule } from './core/toolkit/fabric/fabric.module';
import { IpfsModule } from './core/toolkit/ipfs/ipfs.module';
import { NotificationsModule } from './core/toolkit/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,  // 60 segundos
        limit: 100,  // 100 requests por minuto
      },
    ]),
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
    DatabaseModule,

    // Feature Modules
    AuthModule,
    UserModule,
    StudentsModule,
    AdvisorsModule,
    CoordinatorsModule,
    CoursesModule,
    DefensesModule,
    DocumentsModule,
    ApprovalsModule,
    FabricModule,
    IpfsModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
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
