import { IsUUID, IsOptional, IsString } from 'class-validator';

export class ApplyJobDto {
  @IsUUID()
  jobId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
