import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Customer } from '@salon/database';

export const CurrentCustomer = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Customer => {
    const request = ctx.switchToHttp().getRequest();
    return request.customer;
  },
);
