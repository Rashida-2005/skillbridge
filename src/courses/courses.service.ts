import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto, UpdateProgressDto } from './dto';
import { CourseLevel } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(createCourseDto: CreateCourseDto) {
    const course = await this.prisma.course.create({
      data: {
        ...createCourseDto,
        level: createCourseDto.level as CourseLevel,
      },
    });

    return {
      message: 'Course created successfully',
      course,
    };
  }

  async findAll(filters?: { category?: string; level?: string; search?: string }) {
    const where: any = {};

    if (filters?.category) {
      where.category = { contains: filters.category, mode: 'insensitive' };
    }

    if (filters?.level) {
      where.level = filters.level as CourseLevel;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const courses = await this.prisma.course.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { user_courses: true },
        },
      },
    });

    return {
      courses,
      count: courses.length,
      filters: filters || {},
    };
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        user_courses: {
          select: {
            id: true,
            status: true,
            progress: true,
            user: {
              select: {
                id: true,
                full_name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    await this.findOne(id); // Ensure course exists

    const course = await this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
    });

    return {
      message: 'Course updated successfully',
      course,
    };
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure course exists

    await this.prisma.course.delete({
      where: { id },
    });

    return {
      message: 'Course deleted successfully',
    };
  }

  // ============ Enrollment & Progress ============

  async enroll(userId: string, courseId: string) {
    // Check if course exists
    await this.findOne(courseId);

    // Check if already enrolled
    const existingEnrollment = await this.prisma.userCourse.findUnique({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: courseId,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('Already enrolled in this course');
    }

    const enrollment = await this.prisma.userCourse.create({
      data: {
        user_id: userId,
        course_id: courseId,
        status: 'not_started',
        progress: 0,
      },
      include: {
        course: true,
      },
    });

    return {
      message: 'Successfully enrolled in course',
      enrollment,
    };
  }

  async getMyCourses(userId: string) {
    const enrollments = await this.prisma.userCourse.findMany({
      where: { user_id: userId },
      include: {
        course: {
          include: {
            _count: {
              select: { user_courses: true },
            },
          },
        },
      },
      orderBy: { updated_at: 'desc' },
    });

    const stats = {
      total: enrollments.length,
      completed: enrollments.filter(e => e.status === 'completed').length,
      inProgress: enrollments.filter(e => e.status === 'in_progress').length,
      notStarted: enrollments.filter(e => e.status === 'not_started').length,
      averageProgress: enrollments.length > 0
        ? Math.round(enrollments.reduce((acc, curr) => acc + curr.progress, 0) / enrollments.length)
        : 0,
    };

    return {
      stats,
      enrollments,
    };
  }

  async updateProgress(userId: string, updateProgressDto: UpdateProgressDto) {
    const { courseId, progress } = updateProgressDto;

    const enrollment = await this.prisma.userCourse.findUnique({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: courseId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('You are not enrolled in this course');
    }

    let status = enrollment.status;
    if (progress === 100) {
      status = 'completed';
    } else if (progress > 0 && enrollment.status === 'not_started') {
      status = 'in_progress';
    }

    const updated = await this.prisma.userCourse.update({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: courseId,
        },
      },
      data: {
        progress,
        status,
        ...(status === 'in_progress' && enrollment.status === 'not_started' && { started_at: new Date() }),
        ...(status === 'completed' && enrollment.status !== 'completed' && { completed_at: new Date() }),
      },
      include: {
        course: true,
      },
    });

    return {
      message: 'Progress updated successfully',
      enrollment: updated,
    };
  }

  async getEnrollment(userId: string, courseId: string) {
    const enrollment = await this.prisma.userCourse.findUnique({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: courseId,
        },
      },
      include: {
        course: true,
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('You are not enrolled in this course');
    }

    return enrollment;
  }

  async unenroll(userId: string, courseId: string) {
    const enrollment = await this.prisma.userCourse.findUnique({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: courseId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('You are not enrolled in this course');
    }

    await this.prisma.userCourse.delete({
      where: {
        user_id_course_id: {
          user_id: userId,
          course_id: courseId,
        },
      },
    });

    return {
      message: 'Successfully unenrolled from course',
    };
  }
}