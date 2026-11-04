import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { SessionService } from '../session.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    const { staff, session } = await this.sessionService.validateSession(token);

    (request as any).staff = staff;
    (request as any).session = session;

    return true;
  }

  private extractTokenFromRequest(request: Request): string | null {
    // 1. Try from cookies
    if (request.cookies && request.cookies.salon_session) {
      return request.cookies.salon_session;
    }

    // 2. Try from Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
