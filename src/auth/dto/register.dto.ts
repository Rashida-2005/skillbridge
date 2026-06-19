import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export enum UserRole {
  GRADUATE = 'graduate',
  MENTOR = 'mentor',
  ADMIN = 'admin',
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  full_name: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsString()
  career_goal?: string;
}