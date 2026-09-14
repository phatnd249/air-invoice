import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
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
   * Khởi tạo tài khoản quản trị mặc định nếu database chưa có người dùng
   */
  private async seedInitialAdmin() {
    try {
      const userCount = await this.prisma.user.count();
      if (userCount === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await this.prisma.user.create({
          data: {
            email: 'admin@airobotics.edu.vn',
            password: hashedPassword,
            name: 'Quản Trị Viên (Admin)',
            role: 'ADMIN',
          },
        });
        this.logger.log('Đã khởi tạo tài khoản Admin mặc định: admin@airobotics.edu.vn / admin123');
      }
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
        role: dto.role || 'USER',
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

    const refreshSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
      'super-secret-refresh-key-invoice-air',
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
   * Link được xây dựng từ baseUrl truyền vào (Origin header từ trình duyệt / APP_URL) để khi Deploy
   * lên môi trường khác không cần chỉnh sửa đường link.
   */
  async forgotPassword(email: string, baseUrl?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản với email này trong hệ thống');
    }

    // Token ngẫu nhiên an toàn, chỉ hiện 1 lần trong email / response
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Chỉ lưu SHA-256 hash trong DB — nếu DB bị lộ, token vẫn không thể sử dụng lại
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const expiresInMinutes =
      Number(process.env.PASSWORD_RESET_TTL_MINUTES) || 60;
    const resetExpires = new Date(
      Date.now() + expiresInMinutes * 60 * 1000,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: resetExpires,
      },
    });

    // Xây link đặt lại mật khẩu — ưu tiên origin của trình duyệt (khớp mọi môi trường khi Deploy),
    // fallback APP_URL (env), cuối cùng là localhost cho dev
    const appUrl = baseUrl || process.env.APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl.replace(/\/$/, '')}/reset-password?token=${resetToken}`;

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

    this.logger.log(
      `Yêu cầu đổi mật khẩu cho ${user.email}. Link: ${resetLink}`,
    );

    return {
      message: `Liên kết đặt lại mật khẩu đã được gửi tới ${user.email} (hiệu lực ${expiresInMinutes} phút)`,
      email: user.email,
      resetLink,
      expiresAt: resetExpires.toISOString(),
    };
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

    const jwtSecret = this.configService.get<string>(
      'JWT_SECRET',
      'super-secret-jwt-key-invoice-air',
    );
    const jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');

    const refreshSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
      'super-secret-refresh-key-invoice-air',
    );
    const refreshExpiresIn = this.configService.get<string>(
      'REFRESH_TOKEN_EXPIRES_IN',
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
