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
import { JobsService } from './jobs.service';
import {
  CreateJobDto,
  UpdateJobDto,
  ApplyJobDto,
  UpdateApplicationDto,
} from './dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  async create(@Body() createJobDto: CreateJobDto) {
    return this.jobsService.create(createJobDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto) {
    return this.jobsService.update(id, updateJobDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }

  @Public()
  @Get()
  async findAll(
    @Query('type') type?: string,
    @Query('location') location?: string,
    @Query('search') search?: string,
  ) {
    return this.jobsService.findAll({ type, location, search });
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Post('apply')
  async apply(@Request() req, @Body() applyJobDto: ApplyJobDto) {
    const userId = req.user.id;
    return this.jobsService.apply(userId, applyJobDto);
  }

  @Get('my/applications')
  async getMyApplications(@Request() req) {
    const userId = req.user.id;
    return this.jobsService.getMyApplications(userId);
  }

  @Get('my/applications/:applicationId')
  async getApplication(@Request() req, @Param('applicationId') applicationId: string) {
    const userId = req.user.id;
    return this.jobsService.getApplication(userId, applicationId);
  }

  @Put('my/applications')
  async updateApplicationStatus(
    @Request() req,
    @Body() updateApplicationDto: UpdateApplicationDto,
  ) {
    const userId = req.user.id;
    return this.jobsService.updateApplicationStatus(userId, updateApplicationDto);
  }

  @Delete('my/applications/:applicationId')
  @HttpCode(HttpStatus.OK)
  async withdrawApplication(@Request() req, @Param('applicationId') applicationId: string) {
    const userId = req.user.id;
    return this.jobsService.withdrawApplication(userId, applicationId);
  }

  @Get(':jobId/applications')
  async getJobApplications(@Param('jobId') jobId: string) {
    return this.jobsService.getJobApplications(jobId);
  }

  @Put('applications/:applicationId')
  async adminUpdateApplicationStatus(
    @Param('applicationId') applicationId: string,
    @Body('status') status: string,
    @Body('notes') notes?: string,
  ) {
    return this.jobsService.adminUpdateApplicationStatus(applicationId, status, notes);
  }
}
