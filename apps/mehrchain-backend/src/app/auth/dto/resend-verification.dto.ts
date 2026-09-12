import { ApiProperty } from '@nestjs/swagger';
import { IsValidEmail } from '../validators/is-valid-email.decorator';

export class ResendVerificationDto {
  @ApiProperty({ example: 'user@example.com', description: 'User registered email address' })
  @IsValidEmail()
  email!: string;
}
