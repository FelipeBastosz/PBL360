import { Module } from '@nestjs/common';
import { UserRepositoryToken } from './domain/repositories/user.repository.interface';
import { PgUserRepository } from './infrastructure/pg-user.repository';

@Module({
  providers: [
    {
      provide: UserRepositoryToken,
      useClass: PgUserRepository,
    },
  ],
  exports: [UserRepositoryToken],
})
export class UsersModule {}
