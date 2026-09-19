import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepositoryToken } from './domain/repositories/user.repository.interface';
import { PgUserRepository } from './infrastructure/pg-user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  providers: [
    {
      provide: UserRepositoryToken,
      useClass: PgUserRepository,
    },
  ],
  exports: [UserRepositoryToken],
})
export class UsersModule {}
