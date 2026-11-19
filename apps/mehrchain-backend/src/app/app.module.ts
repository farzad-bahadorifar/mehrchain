import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { authThrottling } from './auth/auth-throttling';
import { CommitmentsModule } from './commitments/commitments.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ChainModule } from './chain/chain.module';
import { MeroModule } from './mero/mero.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot(
      authThrottling(process.env['RENDER'] === 'true', process.env['BACKEND_PROXY_SECRET']),
    ),
    PrismaModule,
    MailModule,
    AuthModule,
    CommitmentsModule,
    UsersModule,
    ChainModule,
    MeroModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
