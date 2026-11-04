import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Staff } from '@salon/database';

export const CurrentStaff = createParamDecorator(
  (data: keyof Staff | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const staff = request.staff;
    return data && staff ? staff[data] : staff;
  }
);
