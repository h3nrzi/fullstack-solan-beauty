import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Customer } from '@salon/database';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerAuthGuard } from './guards/customer-auth.guard';
import { CurrentCustomer } from './decorators/current-customer.decorator';
import { RequestOtpDto, VerifyOtpDto } from './dto/customer-auth.dto';
import { RequestContext } from './dto/auth.dto';

@Controller('api/customer')
export class CustomerController {
  constructor(
    private readonly customerAuthService: CustomerAuthService,
  ) {}

  private extractContext(req: Request): RequestContext {
    return {
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
  }

  private extractToken(req: Request): string | null {
    if (req.cookies && req.cookies.salon_customer_session) {
      return req.cookies.salon_customer_session;
    }
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  @Post('auth/otp/request')
  @HttpCode(HttpStatus.CREATED)
  async requestOtp(@Body() dto: RequestOtpDto, @Req() req: Request) {
    const context = this.extractContext(req);
    const result = await this.customerAuthService.requestOtp(dto.phone, context);
    return result;
  }

  @Post('auth/otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const context = this.extractContext(req);
    const result = await this.customerAuthService.verifyOtp(dto.phone, dto.code, context);

    res.cookie('salon_customer_session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      success: true,
      sessionToken: result.sessionToken,
      customer: result.customer,
    };
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = this.extractToken(req);
    if (token) {
      await this.customerAuthService.revokeSession(token, this.extractContext(req));
    }

    res.clearCookie('salon_customer_session', { path: '/' });
    return { success: true };
  }

  @Get('me')
  @UseGuards(CustomerAuthGuard)
  async getMe(@CurrentCustomer() customer: Customer) {
    return { customer };
  }

  @Get('profile/:customerId')
  @UseGuards(CustomerAuthGuard)
  async getProfile(
    @Param('customerId') customerId: string,
    @CurrentCustomer() customer: Customer,
    @Req() req: Request,
  ) {
    return this.customerAuthService.getProfile(customerId, customer, this.extractContext(req));
  }

  @Get('bookings')
  @UseGuards(CustomerAuthGuard)
  async getBookings(@CurrentCustomer() customer: Customer) {
    const bookings = await this.customerAuthService.getCustomerBookings(customer.id);
    return { bookings };
  }
}
