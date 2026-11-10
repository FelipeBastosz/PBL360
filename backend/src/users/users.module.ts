import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetUserPhotoUseCase } from './application/use-cases/get-user-photo.use-case';
import { GetUserProfileUseCase } from './application/use-cases/get-user-profile.use-case';
import { UpdateUserProfileUseCase } from './application/use-cases/update-user-profile.use-case';
import { UploadUserPhotoUseCase } from './application/use-cases/upload-user-photo.use-case';
import { DeleteUserPhotoUseCase } from './application/use-cases/delete-user-photo.use-case';
import { ChangeUserPasswordUseCase } from './application/use-cases/change-user-password.use-case';
import { SearchTutorsUseCase } from './application/use-cases/search-tutors.use-case';
import { TutorsController } from './infrastructure/http/tutors.controller';

import { User } from './domain/entities/user.entity';
import { UserPhoto } from './domain/entities/user-photo.entity';
import { USER_PHOTO_REPOSITORY } from './domain/repositories/user-photo.repository';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { PASSWORD_HASHER } from '@/auth/domain/services/password-hasher';
import { BcryptPasswordHasher } from '@/auth/infrastructure/security/bcrypt-password-hasher';
import { PgUserPhotoRepository } from './infrastructure/database/pg-user-photo.repository';
import { PgUserRepository } from './infrastructure/database/pg-user.repository';
import { UsersController } from './infrastructure/http/users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPhoto])],
  controllers: [UsersController, TutorsController],
  providers: [
    GetUserPhotoUseCase,
    GetUserProfileUseCase,
    UpdateUserProfileUseCase,
    UploadUserPhotoUseCase,
    DeleteUserPhotoUseCase,
    ChangeUserPasswordUseCase,
    SearchTutorsUseCase,

    {
      provide: USER_REPOSITORY,
      useClass: PgUserRepository,
    },
    {
      provide: USER_PHOTO_REPOSITORY,
      useClass: PgUserPhotoRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
