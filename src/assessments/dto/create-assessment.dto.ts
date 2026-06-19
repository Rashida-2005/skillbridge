import { IsString, IsArray, IsEnum, IsOptional, ValidateNested, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum AssessmentDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export class QuestionDto {
  @IsString()
  question: string;

  @IsArray()
  @IsString({ each: true })
  options: string[];

  @IsNumber()
  correctAnswer: number; // Index of correct answer (0-based)
}

export class CreateAssessmentDto {
  @IsString()
  title: string;

  @IsString()
  category: string;

  @IsEnum(AssessmentDifficulty)
  difficulty: AssessmentDifficulty;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}
