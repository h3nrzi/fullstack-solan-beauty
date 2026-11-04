import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StaffRole } from '@salon/database';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ServicesService } from './services.service';
import { ArtistsService } from './artists.service';
import { CommissionContractsService } from './commission-contracts.service';
import {
  CreateServiceDto,
  CreateArtistProfileDto,
  SetArtistTariffDto,
  CreateCommissionContractDto,
  RejectCommissionContractDto,
} from './dto/catalog.dto';

@Controller('api/admin')
@UseGuards(AuthGuard, RolesGuard)
export class AdminCatalogController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly artistsService: ArtistsService,
    private readonly contractsService: CommissionContractsService,
  ) {}

  @Post('services')
  @Roles(StaffRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async createService(@Body() body: CreateServiceDto, @Req() req: any) {
    return this.servicesService.createService({
      ...body,
      creatorStaffId: req.staff.id,
    });
  }

  @Post('artists/profile')
  @Roles(StaffRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async createArtistProfile(@Body() body: CreateArtistProfileDto) {
    return this.artistsService.createProfile(body);
  }

  @Post('artists/:id/tariffs')
  @Roles(StaffRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async setArtistTariff(@Param('id') artistId: string, @Body() body: SetArtistTariffDto, @Req() req: any) {
    return this.artistsService.setTariff({
      artistId,
      serviceId: body.serviceId,
      priceType: body.priceType,
      fixedPrice: body.fixedPrice,
      minPrice: body.minPrice,
      maxPrice: body.maxPrice,
      fixedDeposit: body.fixedDeposit,
      durationMinutes: body.durationMinutes,
      creatorStaffId: req.staff.id,
    });
  }

  @Post('artists/:id/contracts')
  @Roles(StaffRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async proposeContract(
    @Param('id') artistId: string,
    @Body() body: CreateCommissionContractDto,
    @Req() req: any,
  ) {
    return this.contractsService.proposeContract({
      artistId,
      creatorStaffId: req.staff.id,
      commissionRate: body.commissionRate,
      deductMaterialCost: body.deductMaterialCost,
      effectiveFrom: new Date(body.effectiveFrom),
      effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : undefined,
    });
  }

  @Get('artists/:id/contracts')
  @Roles(StaffRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  async listContracts(@Param('id') artistId: string) {
    return this.contractsService.listContractsForArtist(artistId);
  }

  @Post('contracts/:id/approve')
  @Roles(StaffRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  async approveContract(@Param('id') contractId: string, @Req() req: any) {
    return this.contractsService.approveContract(contractId, req.staff.id);
  }

  @Post('contracts/:id/reject')
  @Roles(StaffRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  async rejectContract(
    @Param('id') contractId: string,
    @Body() body: RejectCommissionContractDto,
    @Req() req: any,
  ) {
    return this.contractsService.rejectContract(contractId, req.staff.id, body.reason);
  }
}
