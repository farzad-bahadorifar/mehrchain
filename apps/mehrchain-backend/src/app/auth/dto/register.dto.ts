import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { IsValidEmail } from '../validators/is-valid-email.decorator';

export class RegisterDto {
  @ApiProperty({ example: 'farzad', description: 'Unique username (3-20 characters)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_]{3,20}$/, {
    message: 'Username must be 3-20 characters and contain only English letters, numbers, and underscores.',
  })
  username!: string;

  @ApiPropertyOptional({ example: 'Farzad B.', description: 'Display name (optional)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'farzad@example.com', description: 'User email address' })
  @IsValidEmail({ message: 'Please provide a valid, active email address.' })
  email!: string;

  @ApiProperty({ example: 'secret123', description: 'Password (min 6 chars)' })
  @IsString()
  @MinLength(6)
  password!: string;
}
