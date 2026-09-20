import { Module } from '@nestjs/common';
import { ChainController } from './chain.controller';
import { ChainService } from './chain.service';
import { ChainCronService } from './chain-cron.service';

@Module({
  controllers: [ChainController],
  providers: [ChainService, ChainCronService],
})
export class ChainModule {}
