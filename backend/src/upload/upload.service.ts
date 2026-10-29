import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface UploadedFileResponse {
  url: string;
  name: string;
  size: number;
  type: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'attachments');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveBase64File(data: {
    name: string;
    base64: string;
    type?: string;
    size?: number;
  }): Promise<UploadedFileResponse> {
    if (!data.name || !data.base64) {
      throw new BadRequestException('Tên file và dữ liệu base64 không được để trống');
    }

    // Làm sạch tên file
    const ext = path.extname(data.name) || '.dat';
    const baseName = path.basename(data.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFilename = `${Date.now()}_${baseName}${ext}`;
    const filePath = path.join(this.uploadDir, safeFilename);

    try {
      const buffer = Buffer.from(data.base64, 'base64');
      if (buffer.length > 20 * 1024 * 1024) {
        throw new BadRequestException('Dung lượng file vượt quá giới hạn 20MB');
      }

      fs.writeFileSync(filePath, buffer);
      this.logger.log(`Đã lưu file thành công: ${safeFilename} (${buffer.length} bytes)`);

      const backendUrl = (
        process.env.BACKEND_URL ||
        process.env.APP_URL ||
        'https://invoice-backend-5tbi.onrender.com'
      ).replace(/\/+$/, '');

      return {
        url: `${backendUrl}/api/upload/file/${safeFilename}`,
        name: data.name,
        size: data.size || buffer.length,
        type: data.type || 'application/octet-stream',
      };
    } catch (err: any) {
      this.logger.error(`Lỗi khi lưu file: ${err.message}`);
      throw new BadRequestException(err.message || 'Không thể lưu file đính kèm');
    }
  }

  getFilePath(filename: string): string {
    const safeFilename = path.basename(filename);
    const fullPath = path.join(this.uploadDir, safeFilename);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('File không tồn tại');
    }
    return fullPath;
  }
}

