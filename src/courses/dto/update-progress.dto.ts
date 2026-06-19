import { IsInt, Min, Max, IsUUID } from 'class-validator';

export class UpdateProgressDto {
  @IsUUID()
  courseId: string;

  @IsInt()
  @Min(0)
  @Max(100)
  progress: number;
}