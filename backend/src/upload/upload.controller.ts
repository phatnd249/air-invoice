import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Res,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { UploadService } from './upload.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import * as path from 'path';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  async uploadFile(
    @Body()
    body: {
      name: string;
      base64: string;
      type?: string;
      size?: number;
    },
  ) {
    return this.uploadService.saveBase64File(body);
  }

  @Public() // Cho phép tải file đính kèm công khai mà không cần đăng nhập
  @Get('file/:filename')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const filePath = this.uploadService.getFilePath(filename);
      const safeFilename = path.basename(filePath).replace(/["\\\r\n]/g, '_');

      // Luôn tải xuống thay vì render inline: chặn stored XSS nếu trong thư mục
      // upload còn file .html/.svg từ trước.
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeFilename}"`,
      );
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.sendFile(filePath);
    } catch {
      throw new NotFoundException('Không tìm thấy file đính kèm');
    }
  }
}
