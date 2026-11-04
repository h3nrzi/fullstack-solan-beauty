import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { CustomerAuthService } from '../customer-auth.service';

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      throw new UnauthorizedException('Customer authentication token missing');
    }

    const { customer, session } = await this.customerAuthService.validateSession(token);

    (request as any).customer = customer;
    (request as any).customerSession = session;

    return true;
  }

  private extractTokenFromRequest(request: Request): string | null {
    if (request.cookies && request.cookies.salon_customer_session) {
      return request.cookies.salon_customer_session;
    }

    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
