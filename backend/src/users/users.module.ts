import { TutorsController } from './infrastructure/http/tutors.controller';
import { SearchTutorsUseCase } from './application/use-cases/search-tutors.use-case';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetUserPhotoUseCase } from './application/use-cases/get-user-photo.use-case';
import { User } from './domain/entities/user.entity';
import { UserPhoto } from './domain/entities/user-photo.entity';
import { USER_PHOTO_REPOSITORY } from './domain/repositories/user-photo.repository';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { PgUserPhotoRepository } from './infrastructure/database/pg-user-photo.repository';
import { PgUserRepository } from './infrastructure/database/pg-user.repository';
import { UsersController } from './infrastructure/http/users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPhoto])],
  controllers: [UsersController, TutorsController],
  providers: [
    GetUserPhotoUseCase,
    SearchTutorsUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: PgUserRepository,
    },
    {
      provide: USER_PHOTO_REPOSITORY,
      useClass: PgUserPhotoRepository,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
