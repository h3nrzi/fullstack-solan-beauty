import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { ScheduleModule } from './schedule/schedule.module';
import { ConsultationModule } from './consultation/consultation.module';

@Module({
  imports: [PrismaModule, AuthModule, CatalogModule, ScheduleModule, ConsultationModule],
})
export class AppModule {}
