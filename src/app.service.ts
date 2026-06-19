import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getHello() {
    const userCount = await this.prisma.user.count();
    return {
      message: '🚀 SkillBridge API is running!',
      version: '1.0.0',
      status: 'online',
      users: userCount,
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        courses: '/api/courses',
        jobs: '/api/jobs',
      },
    };
  }
}