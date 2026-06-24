import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @MinLength(2, { message: 'Ad en az 2 karakter olmalı' })
  @MaxLength(200, { message: 'Ad en fazla 200 karakter olabilir' })
  name!: string;

  @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin' })
  @MaxLength(200)
  email!: string;

  @IsString()
  @MinLength(2, { message: 'Konu en az 2 karakter olmalı' })
  @MaxLength(300, { message: 'Konu en fazla 300 karakter olabilir' })
  subject!: string;

  @IsString()
  @MinLength(10, { message: 'Mesaj en az 10 karakter olmalı' })
  @MaxLength(5000, { message: 'Mesaj en fazla 5000 karakter olabilir' })
  message!: string;
}
