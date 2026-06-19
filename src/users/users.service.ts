import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        bio: true,
        skills: true,
        career_goal: true,
        profile_picture: true,
        created_at: true,
        updated_at: true,
        user_courses: {
          select: {
            id: true,
            status: true,
            progress: true,
            course: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
                level: true,
              },
            },
          },
        },
        user_jobs: {
          select: {
            id: true,
            status: true,
            job: {
              select: {
                id: true,
                title: true,
                company: true,
                type: true,
                location: true,
              },
            },
          },
        },
        mentor_profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        bio: true,
        skills: true,
        career_goal: true,
        profile_picture: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            user_courses: true,
            user_jobs: true,
          },
        },
      },
    });
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const { email, ...updateData } = updateProfileDto;

    // If email is being updated, check if it's taken
    if (email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email is already taken');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        ...(email && { email }),
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        bio: true,
        skills: true,
        career_goal: true,
        profile_picture: true,
        updated_at: true,
      },
    });

    return {
      message: 'Profile updated successfully',
      user,
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { current_password, new_password } = changePasswordDto;

    // Get user with password hash
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      current_password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password_hash: hashedPassword },
    });

    return {
      message: 'Password changed successfully',
    };
  }

  async deleteUser(userId: string) {
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return {
      message: 'User deleted successfully',
    };
  }

  async getDashboardStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_courses: true,
        user_jobs: true,
        user_assessments: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalCourses = user.user_courses.length;
    const completedCourses = user.user_courses.filter(c => c.status === 'completed').length;
    const inProgressCourses = user.user_courses.filter(c => c.status === 'in_progress').length;
    const totalApplications = user.user_jobs.length;
    const successfulApplications = user.user_jobs.filter(j => j.status === 'offered').length;
    const totalAssessments = user.user_assessments.length;
    const passedAssessments = user.user_assessments.filter(a => a.passed).length;

    // Calculate average progress
    const avgProgress = totalCourses > 0
      ? Math.round(user.user_courses.reduce((acc, curr) => acc + curr.progress, 0) / totalCourses)
      : 0;

    return {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
      },
      stats: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        averageProgress: avgProgress,
        totalApplications,
        successfulApplications,
        totalAssessments,
        passedAssessments,
      },
      recentActivity: {
        recentCourses: user.user_courses
          .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
          .slice(0, 3),
        recentApplications: user.user_jobs
          .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
          .slice(0, 3),
      },
    };
  }
}
