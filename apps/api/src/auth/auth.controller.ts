import { Controller, Post, Body, Res, Req, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import { StaffAuthService } from './staff-auth.service';
import { SessionService } from './session.service';

@Controller('api/auth/staff')
export class AuthController {
  constructor(
    private readonly staffAuthService: StaffAuthService,
    private readonly sessionService: SessionService
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return await this.staffAuthService.login({
      username: body.username,
      password: body.password,
      ipAddress,
    });
  }

  @Post('mfa-verify')
  @HttpCode(HttpStatus.OK)
  async verifyMfa(
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.staffAuthService.verifyMfa({
      tempToken: body.tempToken,
      code: body.code,
      ipAddress,
      userAgent,
    });

    res.cookie('salon_session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 60 * 60 * 1000,
    });

    return {
      message: 'MFA verified successfully',
      sessionToken: result.sessionToken,
      staff: {
        id: result.staff.id,
        username: result.staff.username,
        fullName: result.staff.fullName,
        role: result.staff.role,
      },
    };
  }

  @Post('recovery-verify')
  @HttpCode(HttpStatus.OK)
  async verifyRecovery(
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.staffAuthService.verifyRecoveryCode({
      tempToken: body.tempToken,
      recoveryCode: body.recoveryCode,
      ipAddress,
      userAgent,
    });

    res.cookie('salon_session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 60 * 60 * 1000,
    });

    return {
      message: 'Recovery code verified successfully',
      sessionToken: result.sessionToken,
      staff: {
        id: result.staff.id,
        username: result.staff.username,
        fullName: result.staff.fullName,
        role: result.staff.role,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.salon_session || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await this.sessionService.revokeSession(token, req.ip);
    }
    res.clearCookie('salon_session', { path: '/' });
    return { message: 'Logged out successfully' };
  }
}
