import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller()
export class HealthController {
  @Public()
  @Get()
  getHealth() {
    return 'Invoice-AIR API v1.0 - Production Ready';
  }

  @Public()
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      email: {
        hasResendKey: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== ''),
        resendPrefix: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.slice(0, 5) + '...' : null,
        hasSmtpUser: Boolean(process.env.SMTP_USER && process.env.SMTP_USER.trim() !== ''),
        smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
        smtpPort: process.env.SMTP_PORT || 587,
        smtpFrom: process.env.SMTP_FROM || null,
      },
    };
  }
}
