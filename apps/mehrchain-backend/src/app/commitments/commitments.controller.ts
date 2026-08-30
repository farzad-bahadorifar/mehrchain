import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommitmentsService } from './commitments.service';
import { CreateCommitmentDto } from './dto/create-commitment.dto';

@ApiTags('Commitments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('commitments')
export class CommitmentsController {
  constructor(private readonly commitmentsService: CommitmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active commitments for the current user' })
  @ApiResponse({ status: 200, description: 'List of commitments' })
  getUserCommitments(@CurrentUser() user: { id: string }) {
    return this.commitmentsService.getUserCommitments(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new habit commitment' })
  @ApiResponse({ status: 201, description: 'Commitment successfully created' })
  createCommitment(@CurrentUser() user: { id: string }, @Body() dto: CreateCommitmentDto) {
    return this.commitmentsService.createCommitment(user.id, dto);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete commitment for today' })
  @ApiResponse({ status: 200, description: 'Commitment updated and streak recorded' })
  completeCommitment(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body('note') note?: string,
  ) {
    return this.commitmentsService.completeCommitment(user.id, id, note);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive a commitment' })
  @ApiResponse({ status: 200, description: 'Commitment archived' })
  deleteCommitment(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.commitmentsService.deleteCommitment(user.id, id);
  }
}
