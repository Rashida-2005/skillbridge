import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    // Get user ID from JWT payload
    const userId = req.user.id;
    return this.usersService.findOne(userId);
  }

  @Put('profile')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    const userId = req.user.id;
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    const userId = req.user.id;
    return this.usersService.changePassword(userId, changePasswordDto);
  }

  @Get('dashboard/stats')
  async getDashboardStats(@Request() req) {
    const userId = req.user.id;
    return this.usersService.getDashboardStats(userId);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Request() req) {
    const userId = req.user.id;
    return this.usersService.deleteUser(userId);
  }

  // Admin only routes - you can add admin guard later
  @Get()
  async getAllUsers() {
    return this.usersService.findAll();
  }
}
