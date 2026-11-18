import { Controller, Get, Post, Body, Param, Delete, UseGuards, Header } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChainService } from './chain.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { SendNudgeDto } from './dto/send-nudge.dto';
import { SendHeartDto } from './dto/send-heart.dto';
import { DisconnectChainDto } from './dto/disconnect-chain.dto';

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
  @Header('Cache-Control', 'private, no-store')
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
  @Header('Cache-Control', 'private, no-store')
  getConnections(@CurrentUser() user: { id: string }) {
    return this.chainService.getConnections(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('invite/:id')
  cancelInvite(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.chainService.cancelInvite(user.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send one heart per recipient habit day (idempotent)' })
  @Post('connections/:id/heart')
  sendHeart(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: SendHeartDto,
  ) {
    return this.chainService.sendHeart(user.id, id, dto.completionId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Legacy reminder endpoint (no longer supported)' })
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
  disconnect(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: DisconnectChainDto,
  ) {
    return this.chainService.disconnect(user.id, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List private unread disconnect receipts' })
  @Get('disconnect-receipts')
  @Header('Cache-Control', 'private, no-store')
  getDisconnectReceipts(@CurrentUser() user: { id: string }) {
    return this.chainService.getDisconnectReceipts(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('disconnect-receipts/:id/dismiss')
  dismissDisconnectReceipt(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.chainService.dismissDisconnectReceipt(user.id, id);
  }
}
