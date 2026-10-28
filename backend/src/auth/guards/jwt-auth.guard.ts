import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ApiKeysService } from '../../api-keys/api-keys.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private apiKeysService: ApiKeysService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers['x-api-key'] || request.headers['x-api-token'];
    const authHeader = request.headers['authorization'];

    // 1. Kiểm tra nếu có API Key qua x-api-key hoặc Bearer air_live_...
    const potentialKey =
      apiKeyHeader ||
      (authHeader && typeof authHeader === 'string' && authHeader.includes('air_live_')
        ? authHeader.replace(/^Bearer\s+/i, '').replace(/^ApiKey\s+/i, '')
        : null);

    if (potentialKey) {
      const validKey = await this.apiKeysService.validateApiKey(potentialKey);
      if (!validKey) {
        throw new UnauthorizedException('API Key không hợp lệ, đã bị thu hồi hoặc đã hết hạn');
      }

      request.apiKey = validKey;
      request.user = {
        id: `apikey_${validKey.id}`,
        name: validKey.name,
        role: 'API_KEY',
        permissions: validKey.permissions,
      };
      return true;
    }

    // 2. Không có API Key thì dùng JWT Auth tiêu chuẩn
    return super.canActivate(context) as Promise<boolean>;
  }
}

