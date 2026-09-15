import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search users by unique username' })
  @ApiQuery({ name: 'q', required: true, description: 'Username query string' })
  search(@Query('q') q: string, @CurrentUser() user: { id: string }) {
    return this.usersService.searchUsers(q || '', user.id);
  }

  @Get(':username')
  @ApiOperation({ summary: 'Get user public profile by username' })
  getProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfile(username);
  }
}
