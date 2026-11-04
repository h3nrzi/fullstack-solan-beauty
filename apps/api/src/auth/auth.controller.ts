import { Controller, Post, Body, Res, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { StaffAuthService } from './staff-auth.service';
import { SessionService } from './session.service';
import { LoginDto, VerifyMfaDto, VerifyRecoveryCodeDto, RequestContext } from './dto/auth.dto';

@Controller('api/auth/staff')
export class AuthController {
  constructor(
    private readonly staffAuthService: StaffAuthService,
    private readonly sessionService: SessionService
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto, @Req() req: Request) {
    const context: RequestContext = {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    return await this.staffAuthService.login(body.username, body.password, context);
  }

  @Post('mfa-verify')
  @HttpCode(HttpStatus.OK)
  async verifyMfa(
    @Body() body: VerifyMfaDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const context: RequestContext = {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const result = await this.staffAuthService.verifyMfa(body.tempToken, body.code, context);

    this.setSessionCookie(res, result.sessionToken);

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
    @Body() body: VerifyRecoveryCodeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const context: RequestContext = {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const result = await this.staffAuthService.verifyRecoveryCode(
      body.tempToken,
      body.recoveryCode,
      context
    );

    this.setSessionCookie(res, result.sessionToken);

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
      await this.sessionService.revokeSession(token, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }
    res.clearCookie('salon_session', { path: '/' });
    return { message: 'Logged out successfully' };
  }

  private setSessionCookie(res: Response, sessionToken: string): void {
    res.cookie('salon_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 60 * 60 * 1000,
    });
  }
}
