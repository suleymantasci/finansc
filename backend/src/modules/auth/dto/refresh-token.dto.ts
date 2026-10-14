import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RefreshTokenDto {
  @IsOptional()
  @IsString()
  @IsUUID()
  refreshToken?: string;
}
