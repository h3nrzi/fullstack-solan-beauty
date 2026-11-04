import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
  imports: [PrismaModule, AuthModule, CatalogModule, ScheduleModule],
})
export class AppModule {}
