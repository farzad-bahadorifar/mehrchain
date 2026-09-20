import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ auth: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Register a new user account and send verification email' })
  @ApiResponse({ status: 201, description: 'User created; 6-digit OTP verification code sent to email' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({ status: 429, description: 'Too many requests — rate limit exceeded' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  @Throttle({ auth: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Verify email using 6-digit OTP code and activate account' })
  @ApiResponse({ status: 200, description: 'Account verified successfully with JWT accessToken' })
  @ApiResponse({ status: 400, description: 'Invalid or expired verification code' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @Throttle({ auth: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Resend 6-digit OTP verification code to user email' })
  @ApiResponse({ status: 200, description: 'New verification code sent' })
  @ApiResponse({ status: 400, description: 'Email already verified' })
  @ApiResponse({ status: 429, description: 'Too many requests — rate limit exceeded' })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationCode(dto);
  }

  @Post('login')
  @Throttle({ auth: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiResponse({ status: 200, description: 'User successfully authenticated with JWT accessToken' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or unverified email' })
  @ApiResponse({ status: 429, description: 'Too many requests — rate limit exceeded' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Current authenticated user profile' })
  getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permanently delete current authenticated user account and all data' })
  @ApiResponse({ status: 200, description: 'Account permanently deleted' })
  deleteAccount(@CurrentUser() user: { id: string }) {
    return this.authService.deleteAccount(user.id);
  }
}
