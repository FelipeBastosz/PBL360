import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/entities/user.entity';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { PgUserRepository } from './infrastructure/database/pg-user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: PgUserRepository,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
