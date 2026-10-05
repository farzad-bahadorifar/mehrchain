import { ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { IsValidDuration } from '../validators/is-valid-duration.decorator';

export class UpdateCommitmentDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: 'Drink 2 glasses of water', description: 'Habit title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ enum: Category, example: Category.health, description: 'Habit category' })
  @IsEnum(Category)
  @IsOptional()
  category?: Category;

  @ApiPropertyOptional({
    example: 'Feel healthier and more energized',
    description: 'Personal why',
  })
  @IsString()
  @IsOptional()
  why?: string;

  @ApiPropertyOptional({
    example: 30,
    description: 'Duration in days (-1 for endless journey, or >= 1)',
  })
  @IsInt()
  @IsValidDuration()
  @IsOptional()
  totalDays?: number;

  @ApiPropertyOptional({ example: '08:30', description: 'Daily reminder time' })
  @IsString()
  @IsOptional()
  reminderTime?: string;
}
