import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ServicesService } from './services.service';
import { ArtistsService } from './artists.service';
import { CommissionContractsService } from './commission-contracts.service';
import { PublicCatalogController } from './public-catalog.controller';
import { AdminCatalogController } from './admin-catalog.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [PublicCatalogController, AdminCatalogController],
  providers: [ServicesService, ArtistsService, CommissionContractsService],
  exports: [ServicesService, ArtistsService, CommissionContractsService],
})
export class CatalogModule {}
