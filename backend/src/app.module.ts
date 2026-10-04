import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { appConfig, authConfig, databaseConfig, mailConfig } from './config/env.config';
import { validateEnv } from './config/env.validation';
import { buildTypeOrmOptions } from './config/typeorm.config';
import { AuthGuard } from './shared/guards/auth.guard';
import { RolesGuard } from './shared/guards/roles.guard';
import { THROTTLERS } from './shared/throttling/throttlers';
import { HttpLoggerMiddleware } from './shared/middlewares/http-logger.middleware';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { ProblemsModule } from './problems/problems.module';
import { PerformanceTablesModule } from './performance-tables/performance-tables.module';
import { SessionsModule } from './sessions/sessions.module';
import { FeedbacksModule } from './feedbacks/feedbacks.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, mailConfig],
      envFilePath: ['.env'],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot(THROTTLERS),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildTypeOrmOptions,
    }),
    UsersModule,
    AuthModule,
    RoomsModule,
    ProblemsModule,
    PerformanceTablesModule,
    SessionsModule,
    FeedbacksModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpLoggerMiddleware).forRoutes('{*splat}');
  }
}
