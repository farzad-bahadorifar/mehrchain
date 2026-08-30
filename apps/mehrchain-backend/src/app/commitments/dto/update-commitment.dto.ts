import { ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCommitmentDto {
  @ApiPropertyOptional({ example: 'Drink 2 glasses of water', description: 'Habit title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ enum: Category, example: Category.health, description: 'Habit category' })
  @IsEnum(Category)
  @IsOptional()
  category?: Category;

  @ApiPropertyOptional({ example: 'Feel healthier and more energized', description: 'Personal why' })
  @IsString()
  @IsOptional()
  why?: string;

  @ApiPropertyOptional({ example: 30, description: 'Duration in days' })
  @IsInt()
  @Min(1)
  @IsOptional()
  totalDays?: number;

  @ApiPropertyOptional({ example: '08:30', description: 'Daily reminder time' })
  @IsString()
  @IsOptional()
  reminderTime?: string;
}
