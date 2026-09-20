import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SendNudgeDto {
  @ApiPropertyOptional({ description: 'Optional customized nudge message' })
  @IsString()
  @IsOptional()
  message?: string;
}
