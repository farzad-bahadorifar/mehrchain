import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInviteDto {
  @ApiProperty({ description: 'The ID of the commitment to chain with the partner' })
  @IsString()
  @IsNotEmpty()
  commitmentId: string;
}
