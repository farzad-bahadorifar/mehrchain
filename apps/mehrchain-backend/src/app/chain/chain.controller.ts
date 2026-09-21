import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChainService } from './chain.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { SendNudgeDto } from './dto/send-nudge.dto';

@ApiTags('chain')
@Controller('chain')
export class ChainController {
  constructor(private readonly chainService: ChainService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate invite link for a public commitment' })
  @Post('invite')
  createInvite(@CurrentUser() user: { id: string }, @Body() dto: CreateInviteDto) {
    return this.chainService.createInvite(user.id, dto);
  }

  @ApiOperation({ summary: 'Get invite details (public, for accepting)' })
  @Get('invite/:code')
  getInvite(@Param('code') code: string) {
    return this.chainService.getInvite(code);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Accept invite with own commitment ID' })
  @Post('invite/:code/accept')
  acceptInvite(
    @CurrentUser() user: { id: string },
    @Param('code') code: string,
    @Body() dto: AcceptInviteDto,
  ) {
    return this.chainService.acceptInvite(user.id, code, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List active chain connections' })
  @Get('connections')
  getConnections(@CurrentUser() user: { id: string }) {
    return this.chainService.getConnections(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send heart (toggle)' })
  @Post('connections/:id/heart')
  sendHeart(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.chainService.sendHeart(user.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send gentle nudge' })
  @Post('connections/:id/nudge')
  sendNudge(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: SendNudgeDto,
  ) {
    return this.chainService.sendNudge(user.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Disconnect chain' })
  @Delete('connections/:id')
  disconnect(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.chainService.disconnect(user.id, id);
  }
}
