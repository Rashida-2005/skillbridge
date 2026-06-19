import { IsString, IsOptional, IsEnum, IsUrl, IsArray, IsDateString } from 'class-validator';

export enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  INTERNSHIP = 'internship',
  FREELANCE = 'freelance',
  REMOTE = 'remote',
}

export class CreateJobDto {
  @IsString()
  title: string;

  @IsString()
  company: string;

  @IsString()
  description: string;

  @IsString()
  location: string;

  @IsEnum(JobType)
  type: JobType;

  @IsOptional()
  @IsString()
  salary_range?: string;

  @IsArray()
  @IsString({ each: true })
  required_skills: string[];

  @IsUrl()
  application_link: string;

  @IsOptional()
  @IsDateString()
  expires_at?: string;
}
