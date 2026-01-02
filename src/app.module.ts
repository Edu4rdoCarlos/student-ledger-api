import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

// Shared
import { PrismaModule, JwtAuthGuard, RolesGuard } from './shared/infra';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { StudentsModule } from './modules/students/students.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { FabricModule } from './modules/fabric/fabric.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Shared
    PrismaModule,

    // Feature Modules
    AuthModule,
    StudentsModule,
    DocumentsModule,
    FabricModule,
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
