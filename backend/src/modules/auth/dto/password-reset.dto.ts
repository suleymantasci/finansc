import { IsEmail, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(200)
  email!: string;
}

export class ResetPasswordDto {
  /** 64 karakter hex (32 bayt) */
  @IsString()
  @Length(64, 64)
  @Matches(/^[a-f0-9]{64}$/)
  token!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  newPassword!: string;
}
