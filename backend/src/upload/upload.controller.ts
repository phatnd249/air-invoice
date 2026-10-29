import { Controller, Post, Get, Body, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { UploadService } from './upload.service';
import { Public } from '../auth/decorators/public.decorator';
import * as path from 'path';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

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
      return res.sendFile(filePath);
    } catch {
      throw new NotFoundException('Không tìm thấy file đính kèm');
    }
  }
}

