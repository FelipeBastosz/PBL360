import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/entities/user.entity';
import { UserRepositoryToken } from './domain/repositories/user.repository.interface';
import { PgUserRepository } from './infrastructure/pg-user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    {
      provide: UserRepositoryToken,
      useClass: PgUserRepository,
    },
  ],
  exports: [UserRepositoryToken],
})
export class UsersModule {}
