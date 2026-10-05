import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsValidDuration } from '../validators/is-valid-duration.decorator';

export class CreateCommitmentDto {
  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty({ example: 'Drink water after waking up', description: 'Habit title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ enum: Category, example: Category.health, description: 'Habit category' })
  @IsEnum(Category)
  category!: Category;

  @ApiPropertyOptional({
    example: 'To start every day hydrated and energized',
    description: 'Personal why',
  })
  @IsString()
  @IsOptional()
  why?: string;

  @ApiProperty({ example: 21, description: 'Duration in days (-1 for endless journey, or >= 1)' })
  @IsInt()
  @IsValidDuration()
  totalDays!: number;

  @ApiPropertyOptional({ example: '08:30', description: 'Daily reminder time' })
  @IsString()
  @IsOptional()
  reminderTime?: string;
}
