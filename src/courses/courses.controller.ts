import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  UpdateProgressDto,
} from './dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // ============ Admin Routes (you can add admin guard later) ============

  @Post()
  async create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  // ============ Public Routes ============

  @Public()
  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('level') level?: string,
    @Query('search') search?: string,
  ) {
    return this.coursesService.findAll({ category, level, search });
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  // ============ Authenticated User Routes ============

  @Post('enroll')
  async enroll(@Request() req, @Body('courseId') courseId: string) {
    const userId = req.user.id;
    return this.coursesService.enroll(userId, courseId);
  }

  @Get('my/enrollments')
  async getMyCourses(@Request() req) {
    const userId = req.user.id;
    return this.coursesService.getMyCourses(userId);
  }

  @Put('progress')
  async updateProgress(
    @Request() req,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    const userId = req.user.id;
    return this.coursesService.updateProgress(userId, updateProgressDto);
  }

  @Get(':courseId/enrollment')
  async getEnrollment(@Request() req, @Param('courseId') courseId: string) {
    const userId = req.user.id;
    return this.coursesService.getEnrollment(userId, courseId);
  }

  @Delete(':courseId/unenroll')
  @HttpCode(HttpStatus.OK)
  async unenroll(@Request() req, @Param('courseId') courseId: string) {
    const userId = req.user.id;
    return this.coursesService.unenroll(userId, courseId);
  }
}