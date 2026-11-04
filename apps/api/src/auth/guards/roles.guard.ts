import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StaffRole } from '@salon/database';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<StaffRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { staff } = context.switchToHttp().getRequest();
    if (!staff) {
      throw new ForbiddenException('User context missing');
    }

    const hasRole = requiredRoles.includes(staff.role);
    if (!hasRole) {
      throw new ForbiddenException(`Access denied for role: ${staff.role}`);
    }

    return true;
  }
}
