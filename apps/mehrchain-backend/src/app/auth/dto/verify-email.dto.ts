import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { IsValidEmail } from '../validators/is-valid-email.decorator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'user@example.com', description: 'User registered email address' })
  @IsValidEmail()
  email!: string;

  @ApiProperty({ example: '123456', description: '6-digit verification OTP code' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits.' })
  code!: string;
}
