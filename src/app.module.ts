import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

// Shared
import { PrismaModule, JwtAuthGuard, RolesGuard } from './shared';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { StudentsModule } from './modules/students/students.module';
import { AdvisorsModule } from './modules/advisors/advisors.module';
import { CoursesModule } from './modules/courses/courses.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { DefensesModule } from './modules/defenses/defenses.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { FabricModule } from './modules/fabric/fabric.module';
import { IpfsModule } from './modules/ipfs/ipfs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
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
    AdvisorsModule,
    CoursesModule,
    DepartmentsModule,
    DefensesModule,
    DocumentsModule,
    FabricModule,
    IpfsModule,
    NotificationsModule,
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
