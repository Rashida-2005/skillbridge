import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto, UpdateJobDto, ApplyJobDto, UpdateApplicationDto } from './dto';
import { JobType, ApplicationStatus } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  // ============ Job Management ============

  async create(createJobDto: CreateJobDto) {
    const job = await this.prisma.job.create({
      data: {
        ...createJobDto,
        type: createJobDto.type as JobType,
      },
    });

    return {
      message: 'Job posted successfully',
      job,
    };
  }

  async findAll(filters?: { 
    type?: string; 
    location?: string; 
    search?: string;
  }) {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type as JobType;
    }

    if (filters?.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Only show jobs that haven't expired
    where.OR = [
      { expires_at: { gt: new Date() } },
      { expires_at: null },
    ];

    const jobs = await this.prisma.job.findMany({
      where,
      orderBy: { posted_at: 'desc' },
      include: {
        _count: {
          select: { user_jobs: true },
        },
      },
    });

    const jobsWithCounts = jobs.map(job => ({
      ...job,
      applications: job._count.user_jobs,
      _count: undefined,
    }));

    return {
      jobs: jobsWithCounts,
      count: jobsWithCounts.length,
      filters: filters || {},
    };
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        user_jobs: {
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                email: true,
                skills: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const isExpired = job.expires_at && new Date() > job.expires_at;
    const applicationCount = job.user_jobs.length;

    return {
      ...job,
      isExpired,
      applicationCount,
      applications: job.user_jobs,
    };
  }

  async update(id: string, updateJobDto: UpdateJobDto) {
    await this.findOne(id);

    const job = await this.prisma.job.update({
      where: { id },
      data: updateJobDto,
    });

    return {
      message: 'Job updated successfully',
      job,
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.job.delete({
      where: { id },
    });

    return {
      message: 'Job deleted successfully',
    };
  }

  // ============ Job Applications ============

  async apply(userId: string, applyJobDto: ApplyJobDto) {
    const { jobId, notes } = applyJobDto;

    await this.findOne(jobId);

    const existingApplication = await this.prisma.userJob.findUnique({
      where: {
        user_id_job_id: {
          user_id: userId,
          job_id: jobId,
        },
      },
    });

    if (existingApplication) {
      throw new ConflictException('You have already applied to this job');
    }

    const application = await this.prisma.userJob.create({
      data: {
        user_id: userId,
        job_id: jobId,
        status: 'applied',
        applied_at: new Date(),
        notes,
      },
      include: {
        job: {
          select: {
            title: true,
            company: true,
            location: true,
            type: true,
          },
        },
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Application submitted successfully',
      application,
    };
  }

  async getMyApplications(userId: string) {
    const applications = await this.prisma.userJob.findMany({
      where: { user_id: userId },
      include: {
        job: {
          include: {
            _count: {
              select: { user_jobs: true },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const stats = {
      total: applications.length,
      saved: applications.filter(a => a.status === 'saved').length,
      applied: applications.filter(a => a.status === 'applied').length,
      interviewing: applications.filter(a => a.status === 'interviewing').length,
      offered: applications.filter(a => a.status === 'offered').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
    };

    return {
      stats,
      applications,
    };
  }

  async getApplication(userId: string, applicationId: string) {
    const application = await this.prisma.userJob.findFirst({
      where: {
        id: applicationId,
        user_id: userId,
      },
      include: {
        job: {
          include: {
            _count: {
              select: { user_jobs: true },
            },
          },
        },
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            skills: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  async updateApplicationStatus(userId: string, updateApplicationDto: UpdateApplicationDto) {
    const { applicationId, status, notes } = updateApplicationDto;

    const application = await this.prisma.userJob.findFirst({
      where: {
        id: applicationId,
        user_id: userId,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const updated = await this.prisma.userJob.update({
      where: { id: applicationId },
      data: {
        status: status as ApplicationStatus,
        ...(notes && { notes }),
      },
      include: {
        job: {
          select: {
            title: true,
            company: true,
          },
        },
      },
    });

    return {
      message: 'Application status updated successfully',
      application: updated,
    };
  }

  async withdrawApplication(userId: string, applicationId: string) {
    const application = await this.prisma.userJob.findFirst({
      where: {
        id: applicationId,
        user_id: userId,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    await this.prisma.userJob.delete({
      where: { id: applicationId },
    });

    return {
      message: 'Application withdrawn successfully',
    };
  }

  async getJobApplications(jobId: string) {
    await this.findOne(jobId);

    const applications = await this.prisma.userJob.findMany({
      where: { job_id: jobId },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            skills: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      jobId,
      total: applications.length,
      applications,
    };
  }

  async adminUpdateApplicationStatus(applicationId: string, status: string, notes?: string) {
    const application = await this.prisma.userJob.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const updated = await this.prisma.userJob.update({
      where: { id: applicationId },
      data: {
        status: status as ApplicationStatus,
        ...(notes && { notes }),
      },
      include: {
        user: {
          select: {
            full_name: true,
            email: true,
          },
        },
        job: {
          select: {
            title: true,
            company: true,
          },
        },
      },
    });

    return {
      message: 'Application status updated successfully',
      application: updated,
    };
  }
}
