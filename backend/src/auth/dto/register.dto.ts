import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MaxLength(50)
  nickname: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;
}
