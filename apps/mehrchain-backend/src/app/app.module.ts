import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommitmentsModule } from './commitments/commitments.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';

import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, MailModule, AuthModule, CommitmentsModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
