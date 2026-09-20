import { Module } from '@nestjs/common';
import { UsersModule } from '@/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/auth/auth.module';
import { AuthGuard } from '@/shared/guards/auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';

import { CreateRoomUseCase } from './application/use-cases/create-room.use-case';
import { UpdateRoomUseCase } from './application/use-cases/update-room.use-case';
import { Room } from './domain/entities/room.entity';
import { ROOM_REPOSITORY } from './domain/repositories/room.repository';
import { PgRoomRepository } from './infrastructure/database/pg-room.repository';
import { RoomsController } from './infrastructure/http/rooms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Room]), AuthModule, UsersModule],
  controllers: [RoomsController],
  providers: [
    CreateRoomUseCase,
    UpdateRoomUseCase,
    AuthGuard,
    RolesGuard,
    {
      provide: ROOM_REPOSITORY,
      useClass: PgRoomRepository,
    },
  ],
})
export class RoomsModule {}
