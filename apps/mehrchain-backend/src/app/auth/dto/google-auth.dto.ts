import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google ID token (credential) obtained from Google Identity Services',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Google ID token cannot be empty' })
  idToken: string;
}
