import { Throttle } from '@nestjs/throttler';
import {
  Controller,
  Post,
  Patch,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  Get,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { RegisterDto, LoginDto, RefreshTokenDto, UpdateProfileDto, ChangePasswordDto } from './dto';
import { Public, CurrentUser } from '../../common/decorators';
import { REFRESH_COOKIE, readCookie, setSessionCookies, clearSessionCookies } from '../../common/session';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordReset: PasswordResetService,
    private readonly config: ConfigService,
  ) {}

  /** Her durumda aynı yanıt — hesabın varlığı sızdırılmaz */
  @Public()
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordReset.requestReset(dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 900000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordReset.resetPassword(dto.token, dto.newPassword);
  }

  @Public()
  // Kayıt spam'i: IP başına 10 dakikada 5
  @Throttle({ default: { limit: 5, ttl: 600000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.sessionResponse(await this.authService.register(dto), req, res);
  }

  @Public()
  // Kaba kuvvet koruması: IP başına dakikada 10 deneme (trust proxy ile gerçek IP)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.login(
      dto,
      req.headers['user-agent'],
      req.ip,
    );
    return this.sessionResponse(tokens, req, res);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieMode = req.headers['x-session-mode'] === 'cookie' || !dto.refreshToken;
    const token = cookieMode ? readCookie(req.headers.cookie, REFRESH_COOKIE) : dto.refreshToken;
    if (!token) throw new UnauthorizedException('Oturum bulunamadı');
    try {
      const tokens = await this.authService.refreshTokens(token);
      return this.sessionResponse(tokens, req, res, cookieMode);
    } catch (error) {
      if (cookieMode) clearSessionCookies(res, this.config);
      throw error;
    }
  }

  @ApiBearerAuth()
  @Get('me')
  @Throttle({ default: { limit: 600, ttl: 60000 } })
  profile(@CurrentUser('id') userId: string, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return this.authService.profile(userId);
  }

  @ApiBearerAuth()
  @Patch('profile')
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(userId, dto);
  }

  @ApiBearerAuth()
  @Post('change-password')
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.changePassword(userId, dto);
    return { ...this.sessionResponse(tokens, req, res), message: tokens.message };
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser('id') userId: string, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.logout(userId);
    clearSessionCookies(res, this.config);
    return result;
  }

  private sessionResponse(tokens: Awaited<ReturnType<AuthService['login']>>, req: Request, res: Response, cookieMode = false) {
    res.setHeader('Cache-Control', 'no-store');
    if (cookieMode || req.headers['x-session-mode'] === 'cookie') {
      setSessionCookies(res, tokens, this.config);
      return { user: tokens.user };
    }
    // Explicit bearer/refresh clients (e.g. publishing scripts) remain supported.
    return tokens;
  }
}
