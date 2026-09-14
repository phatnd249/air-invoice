import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Xác định base URL của Frontend để xây link đặt lại mật khẩu.
   * Ưu tiên Origin header từ trình duyệt (tự động đúng theo domain đang truy cập khi Deploy),
   * fallback host qua reverse proxy, rồi đến APP_URL / localhost.
   */
  private resolveAppBaseUrl(req: Request): string {
    const origin = req.get('origin');
    if (origin) return origin;

    const host = req.get('host');
    if (host) {
      const protocol =
        req.get('x-forwarded-proto')?.split(',')[0]?.trim() || req.protocol;
      return `${protocol}://${host}`;
    }

    return process.env.APP_URL || 'http://localhost:3000';
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    try {
      return await this.authService.login(dto);
    } catch (err) {
      console.error('Login error in controller:', err);
      throw err;
    }
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Public()
  @Post('check-email')
  @HttpCode(HttpStatus.OK)
  async checkEmail(@Body() dto: { email: string }) {
    return this.authService.checkEmail(dto.email);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: { email: string }, @Req() req: Request) {
    const baseUrl = this.resolveAppBaseUrl(req);
    return this.authService.forgotPassword(dto.email, baseUrl);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: { token: string; newPassword: string }) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}
