import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInviteDto {
  @ApiProperty({ description: 'The ID of the commitment to chain' })
  @IsString()
  @IsNotEmpty()
  commitmentId: string;
}
