import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateCommitmentDto {
  @ApiProperty({ example: 'Drink water after waking up', description: 'Habit title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ enum: Category, example: Category.health, description: 'Habit category' })
  @IsEnum(Category)
  category!: Category;

  @ApiPropertyOptional({ example: 'To start every day hydrated and energized', description: 'Personal why' })
  @IsString()
  @IsOptional()
  why?: string;

  @ApiProperty({ example: 21, description: 'Duration in days' })
  @IsInt()
  @Min(1)
  totalDays!: number;

  @ApiPropertyOptional({ example: '08:30', description: 'Daily reminder time' })
  @IsString()
  @IsOptional()
  reminderTime?: string;
}
