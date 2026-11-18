import { IsUUID } from 'class-validator';

export class SendHeartDto {
  @IsUUID()
  completionId!: string;
}
