import { IsUUID, IsArray, IsNumber } from 'class-validator';

export class SubmitAssessmentDto {
  @IsUUID()
  assessmentId: string;

  @IsArray()
  @IsNumber({}, { each: true })
  answers: number[]; // Array of selected answer indices
}
