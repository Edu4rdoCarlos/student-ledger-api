import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Academic Ledger API')
    .setDescription(`
## Academic Document Management API with Hyperledger Fabric

### Key Features
- Thesis defense management
- Multi-stage approval workflow (Coordinator, Advisor, Student)
- Immutable blockchain registration (Hyperledger Fabric)
- Distributed storage via private IPFS network
- Approved document versioning
- Document authenticity validation

### Architecture
- **Validation**: Postgres (cache) with fallback to Hyperledger Fabric (source of truth)
- **Storage**: Private IPFS network (isolated via swarm key)
- **Queues**: Bull/Redis for asynchronous processing
- **Authentication**: JWT + Refresh Token (HTTP-only cookie)

### Approval Workflow
1. Coordinator submits defense result (ATA + FICHA documents)
2. System creates approvals for COORDINATOR, ADVISOR and STUDENT
3. Each party approves or rejects the document
4. After all approvals, document is registered on blockchain
5. Approved documents can be versioned (with new approval workflow)
    `)
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'JWT token obtained from login (valid for 15 minutes)',
      in: 'header',
    })
    .addCookieAuth('refresh_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'refresh_token',
      description: 'HTTP-only refresh token cookie for automatic token renewal (valid for 7 days)',
    })
    .addTag('Auth', 'Authentication and session management (login, logout, refresh token)')
    .addTag('Defenses', 'Thesis defense management')
    .addTag('Documents', 'Document management and validation')
    .addTag('Approvals', 'Document approval workflow')
    .addTag('Students', 'Student management')
    .addTag('Advisors', 'Advisor management')
    .addTag('Courses', 'Course management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
}

bootstrap();
