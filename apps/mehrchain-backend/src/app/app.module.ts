import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommitmentsModule } from './commitments/commitments.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, CommitmentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
