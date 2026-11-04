import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Customer } from '@salon/database';
import { CustomerAuthGuard } from '../auth/guards/customer-auth.guard';
import { CurrentCustomer } from '../auth/decorators/current-customer.decorator';
import { ConsultationService } from './consultation.service';
import {
  CreateConsultationDto,
  ProvideInfoDto,
  WithdrawDto,
} from './dto/consultation.dto';
import { ConsultationRequestDto } from '@salon/shared';

@Controller('api/customer/consultations')
@UseGuards(CustomerAuthGuard)
export class CustomerConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentCustomer() customer: Customer,
    @Body() dto: CreateConsultationDto,
  ): Promise<ConsultationRequestDto> {
    return this.consultationService.createRequest(customer.id, dto);
  }

  @Get()
  async list(@CurrentCustomer() customer: Customer): Promise<ConsultationRequestDto[]> {
    return this.consultationService.listCustomerRequests(customer.id);
  }

  @Get(':id')
  async getOne(
    @CurrentCustomer() customer: Customer,
    @Param('id') id: string,
  ): Promise<ConsultationRequestDto> {
    return this.consultationService.getRequestById(id, customer.id);
  }

  @Post(':id/info')
  @HttpCode(HttpStatus.OK)
  async provideInfo(
    @CurrentCustomer() customer: Customer,
    @Param('id') id: string,
    @Body() dto: ProvideInfoDto,
  ): Promise<ConsultationRequestDto> {
    return this.consultationService.provideInfo(id, customer.id, dto.answer);
  }

  @Post(':id/withdraw')
  @HttpCode(HttpStatus.OK)
  async withdraw(
    @CurrentCustomer() customer: Customer,
    @Param('id') id: string,
    @Body() dto: WithdrawDto,
  ): Promise<ConsultationRequestDto> {
    return this.consultationService.withdrawRequest(id, customer.id, dto.reason);
  }
}
