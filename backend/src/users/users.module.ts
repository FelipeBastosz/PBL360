import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/entities/user.entity';
import { UserPhoto } from './domain/entities/user-photo.entity';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { PgUserRepository } from './infrastructure/database/pg-user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPhoto])],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: PgUserRepository,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
