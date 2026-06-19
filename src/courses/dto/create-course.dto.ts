import { IsString, IsOptional, IsEnum, IsUrl, IsArray } from 'class-validator';

export enum CourseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  provider: string;

  @IsUrl()
  url: string;

  @IsString()
  category: string;

  @IsEnum(CourseLevel)
  level: CourseLevel;

  @IsString()
  duration: string;

  @IsOptional()
  @IsUrl()
  thumbnail?: string;
}