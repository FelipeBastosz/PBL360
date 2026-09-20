import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateRoomDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  semester?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
