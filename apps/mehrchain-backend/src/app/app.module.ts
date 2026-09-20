import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommitmentsModule } from './commitments/commitments.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';

import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'auth',
        ttl: 60000, // 60 seconds window
        limit: 10,  // max 10 requests per window
      },
    ]),
    PrismaModule,
    MailModule,
    AuthModule,
    CommitmentsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
