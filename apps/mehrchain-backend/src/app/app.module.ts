import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommitmentsModule } from './commitments/commitments.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

import { ScheduleModule } from '@nestjs/schedule';

import { ChainModule } from './chain/chain.module';


@Module({
  imports: [
    
    ScheduleModule.forRoot(),
    MailModule,
    AuthModule,
    CommitmentsModule,
    UsersModule,
    ChainModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
