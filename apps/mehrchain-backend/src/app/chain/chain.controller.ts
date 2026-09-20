import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request as NestRequest } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChainService } from './chain.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
  createInvite(@NestRequest() req: Request, @Body() dto: CreateInviteDto) {
    return this.chainService.createInvite(req.user.id, dto);
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
  acceptInvite(@NestRequest() req: Request, @Param('code') code: string, @Body() dto: AcceptInviteDto) {
    return this.chainService.acceptInvite(req.user.id, code, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List active chain connections' })
  @Get('connections')
  getConnections(@NestRequest() req: Request) {
    return this.chainService.getConnections(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send heart (toggle)' })
  @Post('connections/:id/heart')
  sendHeart(@NestRequest() req: Request, @Param('id') id: string) {
    return this.chainService.sendHeart(req.user.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send gentle nudge' })
  @Post('connections/:id/nudge')
  sendNudge(@NestRequest() req: Request, @Param('id') id: string, @Body() dto: SendNudgeDto) {
    return this.chainService.sendNudge(req.user.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Disconnect chain' })
  @Delete('connections/:id')
  disconnect(@NestRequest() req: Request, @Param('id') id: string) {
    return this.chainService.disconnect(req.user.id, id);
  }
}

