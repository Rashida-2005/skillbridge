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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import {
  CreateAssessmentDto,
  UpdateAssessmentDto,
  SubmitAssessmentDto,
} from './dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  // ============ Admin Routes ============

  @Post()
  async create(@Body() createAssessmentDto: CreateAssessmentDto) {
    return this.assessmentsService.create(createAssessmentDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateAssessmentDto: UpdateAssessmentDto) {
    return this.assessmentsService.update(id, updateAssessmentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.assessmentsService.remove(id);
  }

  // ============ Public Routes ============

  @Public()
  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string,
    @Query('search') search?: string,
  ) {
    return this.assessmentsService.findAll({ category, difficulty, search });
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.assessmentsService.findOne(id);
  }

  // ============ Authenticated User Routes ============

  @Post('submit')
  async submitAssessment(@Request() req, @Body() submitAssessmentDto: SubmitAssessmentDto) {
    const userId = req.user.id;
    return this.assessmentsService.submitAssessment(userId, submitAssessmentDto);
  }

  @Get('my/results')
  async getUserResults(@Request() req) {
    const userId = req.user.id;
    return this.assessmentsService.getUserResults(userId);
  }

  @Get('my/results/:resultId')
  async getResult(@Request() req, @Param('resultId') resultId: string) {
    const userId = req.user.id;
    return this.assessmentsService.getResult(userId, resultId);
  }

  // ============ Admin Routes ============

  @Get(':assessmentId/results')
  async getAssessmentResults(@Param('assessmentId') assessmentId: string) {
    return this.assessmentsService.getAssessmentResults(assessmentId);
  }
}
