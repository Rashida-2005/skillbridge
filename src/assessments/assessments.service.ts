import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssessmentDto, UpdateAssessmentDto, SubmitAssessmentDto } from './dto';
import { AssessmentDifficulty } from '@prisma/client';

@Injectable()
export class AssessmentsService {
  constructor(private prisma: PrismaService) {}

  // ============ Assessment Management ============

  async create(createAssessmentDto: CreateAssessmentDto) {
    // Convert questions to JSON-compatible format
    const questions = createAssessmentDto.questions.map(q => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
    }));

    const assessment = await this.prisma.assessment.create({
      data: {
        title: createAssessmentDto.title,
        category: createAssessmentDto.category,
        difficulty: createAssessmentDto.difficulty as AssessmentDifficulty,
        questions: questions as any, // Type assertion for Prisma Json type
      },
    });

    return {
      message: 'Assessment created successfully',
      assessment,
    };
  }

  async findAll(filters?: { category?: string; difficulty?: string; search?: string }) {
    const where: any = {};

    if (filters?.category) {
      where.category = { contains: filters.category, mode: 'insensitive' };
    }

    if (filters?.difficulty) {
      where.difficulty = filters.difficulty as AssessmentDifficulty;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const assessments = await this.prisma.assessment.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { user_assessments: true },
        },
      },
    });

    const assessmentsWithCounts = assessments.map(assessment => ({
      ...assessment,
      attempts: assessment._count.user_assessments,
      _count: undefined,
    }));

    return {
      assessments: assessmentsWithCounts,
      count: assessmentsWithCounts.length,
      filters: filters || {},
    };
  }

  async findOne(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        user_assessments: {
          include: {
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

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    // Safely handle questions with type guard
    const questions = assessment.questions as any[];
    const publicQuestions = Array.isArray(questions) 
      ? questions.map((q: any) => ({
          question: q.question,
          options: q.options,
          // Don't include correctAnswer for public view
        }))
      : [];

    return {
      id: assessment.id,
      title: assessment.title,
      category: assessment.category,
      difficulty: assessment.difficulty,
      questions: publicQuestions,
      totalAttempts: assessment.user_assessments.length,
      created_at: assessment.created_at,
    };
  }

  async getFullAssessment(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    return assessment;
  }

  async update(id: string, updateAssessmentDto: UpdateAssessmentDto) {
    await this.findOne(id);

    // Prepare update data
    const updateData: any = {};
    if (updateAssessmentDto.title) updateData.title = updateAssessmentDto.title;
    if (updateAssessmentDto.category) updateData.category = updateAssessmentDto.category;
    if (updateAssessmentDto.difficulty) updateData.difficulty = updateAssessmentDto.difficulty;
    if (updateAssessmentDto.questions) {
      updateData.questions = updateAssessmentDto.questions.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
      })) as any;
    }

    const assessment = await this.prisma.assessment.update({
      where: { id },
      data: updateData,
    });

    return {
      message: 'Assessment updated successfully',
      assessment,
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.assessment.delete({
      where: { id },
    });

    return {
      message: 'Assessment deleted successfully',
    };
  }

  // ============ Taking Assessments ============

  async submitAssessment(userId: string, submitAssessmentDto: SubmitAssessmentDto) {
    const { assessmentId, answers } = submitAssessmentDto;

    const assessment = await this.getFullAssessment(assessmentId);

    const existingAttempt = await this.prisma.userAssessment.findUnique({
      where: {
        user_id_assessment_id: {
          user_id: userId,
          assessment_id: assessmentId,
        },
      },
    });

    if (existingAttempt) {
      throw new ConflictException('You have already taken this assessment');
    }

    // Safely handle questions with type guard
    const questions = assessment.questions as any[];
    if (!Array.isArray(questions)) {
      throw new BadRequestException('Invalid assessment format');
    }

    if (answers.length !== questions.length) {
      throw new BadRequestException('Number of answers does not match questions');
    }

    let correctCount = 0;
    answers.forEach((answer, index) => {
      if (answer === questions[index].correctAnswer) {
        correctCount++;
      }
    });

    const totalQuestions = questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 60;

    const result = await this.prisma.userAssessment.create({
      data: {
        user_id: userId,
        assessment_id: assessmentId,
        score,
        passed,
        taken_at: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        assessment: {
          select: {
            title: true,
            category: true,
            difficulty: true,
          },
        },
      },
    });

    return {
      message: 'Assessment submitted successfully',
      result: {
        id: result.id,
        score: result.score,
        passed: result.passed,
        correctCount,
        totalQuestions,
        percentage: `${score}%`,
        takenAt: result.taken_at,
      },
      assessment: result.assessment,
      user: result.user,
    };
  }

  async getUserResults(userId: string) {
    const results = await this.prisma.userAssessment.findMany({
      where: { user_id: userId },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            category: true,
            difficulty: true,
          },
        },
      },
      orderBy: { taken_at: 'desc' },
    });

    const stats = {
      totalTaken: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      averageScore: results.length > 0
        ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length)
        : 0,
    };

    return {
      stats,
      results,
    };
  }

  async getResult(userId: string, resultId: string) {
    const result = await this.prisma.userAssessment.findFirst({
      where: {
        id: resultId,
        user_id: userId,
      },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            category: true,
            difficulty: true,
            questions: true,
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

    if (!result) {
      throw new NotFoundException('Result not found');
    }

    return result;
  }

  async getAssessmentResults(assessmentId: string) {
    await this.findOne(assessmentId);

    const results = await this.prisma.userAssessment.findMany({
      where: { assessment_id: assessmentId },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: { score: 'desc' },
    });

    const stats = {
      totalAttempts: results.length,
      passCount: results.filter(r => r.passed).length,
      failCount: results.filter(r => !r.passed).length,
      passRate: results.length > 0
        ? Math.round((results.filter(r => r.passed).length / results.length) * 100)
        : 0,
      averageScore: results.length > 0
        ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length)
        : 0,
    };

    return {
      stats,
      results,
    };
  }
}
