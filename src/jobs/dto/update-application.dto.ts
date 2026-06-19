import { IsUUID, IsEnum, IsOptional, IsString } from 'class-validator';

export enum ApplicationStatus {
  SAVED = 'saved',
  APPLIED = 'applied',
  INTERVIEWING = 'interviewing',
  REJECTED = 'rejected',
  OFFERED = 'offered',
}

export class UpdateApplicationDto {
  @IsUUID()
  applicationId: string;

  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
