import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  OnModuleInit,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryService } from '../delivery/delivery.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { getJwtSecret } from './jwt-config';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly deliveryService: DeliveryService,
  ) {}

  async onModuleInit() {
    await this.seedInitialAdmin();
  }

  /**
   * Khởi tạo tài khoản quản trị ĐẦU TIÊN khi database chưa có người dùng nào.
   * 🔒 Không hardcode mật khẩu trong source: chỉ tạo khi có SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD.
   */
  private async seedInitialAdmin() {
    try {
      const userCount = await this.prisma.user.count();
      if (userCount > 0) return;

      const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
      const password = process.env.SEED_ADMIN_PASSWORD;

      if (!email || !password) {
        this.logger.warn(
          'Database chưa có người dùng nào. Bỏ qua tạo admin mặc định — hãy đặt SEED_ADMIN_EMAIL và SEED_ADMIN_PASSWORD để khởi tạo tài khoản quản trị đầu tiên.',
        );
        return;
      }

      if (password.length < 12) {
        this.logger.error(
          'SEED_ADMIN_PASSWORD phải có tối thiểu 12 ký tự — bỏ qua tạo tài khoản admin đầu tiên.',
        );
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: process.env.SEED_ADMIN_NAME?.trim() || 'Quản Trị Viên (Admin)',
          role: 'ADMIN',
        },
      });
      this.logger.log(`Đã khởi tạo tài khoản Admin đầu tiên: ${email}`);
    } catch (error) {
      this.logger.error('Lỗi khi kiểm tra / khởi tạo Admin mặc định', error);
    }
  }

  /**
   * Đăng nhập người dùng
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateHashedRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Đăng ký tài khoản mới
   */
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng trong hệ thống');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.trim().toLowerCase(),
        password: hashedPassword,
        name: dto.name || 'Người dùng mới',
        role: 'USER', // 🔒 Force USER role - ADMIN can only be created by existing ADMIN via /api/users
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateHashedRefreshToken(user.id, tokens.refreshToken);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Cấp phát lại Token mới qua Refresh Token
   */
  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token không được để trống');
    }

    const refreshSecret = getJwtSecret(
      this.configService,
      'REFRESH_TOKEN_SECRET',
    );

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Phiên đăng nhập đã bị hủy hoặc không tồn tại');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateHashedRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Đăng xuất người dùng (xóa Refresh Token)
   */
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });

    return { message: 'Đăng xuất thành công' };
  }

  /**
   * Lấy thông tin tài khoản hiện tại
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy thông tin tài khoản');
    }

    return user;
  }

  /**
   * Xác minh email có tồn tại trong hệ thống hay không
   * (không tiết lộ thông tin tài khoản, chỉ trả về exists)
   */
  async checkEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    return {
      email: normalizedEmail,
      exists: !!user,
    };
  }

  /**
   * Yêu cầu khôi phục mật khẩu (Quên mật khẩu)
   * Sinh token an toàn (64 ký tự hex) → lưu SHA-256 hash vào DB → gửi email kèm link đặt lại mật khẩu.
   * Link được xây dựng DUY NHẤT từ APP_URL trong biến môi trường — tuyệt đối không dùng
   * header `Origin`/`Host` do client kiểm soát (nếu không, kẻ tấn công có thể đánh cắp token).
   */
  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const expiresInMinutes =
      Number(process.env.PASSWORD_RESET_TTL_MINUTES) || 60;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // 🔒 Phản hồi LUÔN giống nhau dù email có tồn tại hay không → chống dò tài khoản
    const genericResponse = {
      message: `Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi (hiệu lực ${expiresInMinutes} phút)`,
      email: normalizedEmail,
      expiresAt: expiresAt.toISOString(),
    };

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      this.logger.warn(
        `Yêu cầu đặt lại mật khẩu cho email không tồn tại: ${normalizedEmail}`,
      );
      return genericResponse;
    }

    // Token ngẫu nhiên an toàn, chỉ hiện 1 lần trong email / response
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Chỉ lưu SHA-256 hash trong DB — nếu DB bị lộ, token vẫn không thể sử dụng lại
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: expiresAt,
      },
    });

    // 🔒 Chỉ dùng APP_URL cấu hình trong env (allowlist), không lấy từ request
    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(
      /\/+$/,
      '',
    );
    const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

    // Gửi email kèm link (không throw nếu SMTP chưa cấu hình — vẫn trả link để dev demo)
    try {
      await this.deliveryService.sendPasswordResetEmail(
        user.email,
        user.name,
        resetLink,
        expiresInMinutes,
      );
    } catch (error: any) {
      this.logger.warn(
        `Không thể gửi email đặt lại mật khẩu tới ${user.email}: ${error.message}`,
      );
    }

    // 🔒 Không log token/link — chỉ log email + thời hạn
    this.logger.log(
      `Đã tạo yêu cầu đặt lại mật khẩu cho ${user.email} (hiệu lực ${expiresInMinutes} phút)`,
    );

    // 🔒 Security: Do NOT expose resetLink in production API response
    // Link should only be sent via email, not returned to client
    const response: any = { ...genericResponse, email: user.email };

    // Development only: Include link for testing when SMTP not configured
    if (process.env.NODE_ENV === 'development') {
      response.resetLink = resetLink;
      response._devNote = 'resetLink chỉ hiển thị trong development mode';
    }

    return response;
  }

  /**
   * Đặt lại mật khẩu bằng link (token) nhận được qua email
   */
  async resetPassword(token: string, newPassword: string) {
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token.trim())
      .digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        hashedRefreshToken: null, // Thu hồi tất cả phiên đăng nhập cũ
      },
    });

    this.logger.log(
      `Tài khoản ${user.email} đã đặt lại mật khẩu thành công`,
    );

    return {
      message:
        'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.',
    };
  }

  /**
   * Sinh bộ Access Token và Refresh Token
   */
  private async generateTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    const jwtSecret = getJwtSecret(this.configService, 'JWT_SECRET');
    const refreshSecret = getJwtSecret(
      this.configService,
      'REFRESH_TOKEN_SECRET',
    );
    const sanitizeExpiresIn = (raw: string | undefined, defaultVal: string) => {
      let val = (raw || defaultVal).toString().trim().replace(/['"]/g, '');
      if (/^\d+$/.test(val)) {
        const num = parseInt(val, 10);
        val = defaultVal.endsWith('d')
          ? (num <= 30 ? `${num}d` : `${num}s`)
          : (num <= 60 ? `${num}m` : `${num}s`);
      }
      if (val === '0' || val === '0m' || val === '0s' || val === '0d' || !val) {
        val = defaultVal;
      }
      return val;
    };

    const jwtExpiresIn = sanitizeExpiresIn(
      this.configService.get<string>('JWT_EXPIRES_IN'),
      '15m',
    );
    const refreshExpiresIn = sanitizeExpiresIn(
      this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN'),
      '7d',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: jwtExpiresIn as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Cập nhật Refresh Token đã hash vào CSDL
   */
  private async updateHashedRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: hashed },
    });
  }
}
