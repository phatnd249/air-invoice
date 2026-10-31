import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface UploadedFileResponse {
  url: string;
  name: string;
  size: number;
  type: string;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

interface AllowedFileType {
  /** MIME chuẩn dùng khi gửi email / trả về client */
  mime: string;
  /** Các MIME client được phép khai báo (rỗng = bỏ qua kiểm tra) */
  clientMimes: string[];
  /** Kiểm tra chữ ký file (magic bytes). Bỏ trống với file text thuần. */
  isValid?: (buffer: Buffer) => boolean;
}

const startsWith = (buffer: Buffer, bytes: number[]): boolean =>
  buffer.length >= bytes.length && bytes.every((b, i) => buffer[i] === b);

const isZip = (buffer: Buffer): boolean =>
  startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]);

const isOle = (buffer: Buffer): boolean =>
  startsWith(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

/**
 * Allowlist loại file được phép upload.
 * KHÔNG cho phép .html/.htm/.svg/.js/.exe... vì có thể dẫn tới stored XSS
 * hoặc phát tán mã độc qua link công khai /api/upload/file/:filename.
 */
const ALLOWED_FILE_TYPES: Record<string, AllowedFileType> = {
  '.pdf': {
    mime: 'application/pdf',
    clientMimes: ['application/pdf'],
    isValid: (b) => startsWith(b, [0x25, 0x50, 0x44, 0x46, 0x2d]), // %PDF-
  },
  '.png': {
    mime: 'image/png',
    clientMimes: ['image/png'],
    isValid: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  '.jpg': {
    mime: 'image/jpeg',
    clientMimes: ['image/jpeg', 'image/jpg'],
    isValid: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  },
  '.jpeg': {
    mime: 'image/jpeg',
    clientMimes: ['image/jpeg', 'image/jpg'],
    isValid: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  },
  '.gif': {
    mime: 'image/gif',
    clientMimes: ['image/gif'],
    isValid: (b) => startsWith(b, [0x47, 0x49, 0x46, 0x38]), // GIF8
  },
  '.webp': {
    mime: 'image/webp',
    clientMimes: ['image/webp'],
    isValid: (b) =>
      startsWith(b, [0x52, 0x49, 0x46, 0x46]) && // RIFF
      b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
  '.doc': {
    mime: 'application/msword',
    clientMimes: ['application/msword'],
    isValid: isOle,
  },
  '.xls': {
    mime: 'application/vnd.ms-excel',
    clientMimes: ['application/vnd.ms-excel'],
    isValid: isOle,
  },
  '.ppt': {
    mime: 'application/vnd.ms-powerpoint',
    clientMimes: ['application/vnd.ms-powerpoint'],
    isValid: isOle,
  },
  '.docx': {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    clientMimes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/octet-stream',
    ],
    isValid: isZip,
  },
  '.xlsx': {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    clientMimes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/octet-stream',
    ],
    isValid: isZip,
  },
  '.pptx': {
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    clientMimes: [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/octet-stream',
    ],
    isValid: isZip,
  },
  '.txt': {
    mime: 'text/plain',
    clientMimes: ['text/plain'],
  },
  '.csv': {
    mime: 'text/csv',
    clientMimes: ['text/csv', 'application/csv', 'text/plain'],
  },
};

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

    const originalName = path.basename(String(data.name).trim()).slice(0, 255);
    if (!originalName || originalName === '.' || originalName === '..') {
      throw new BadRequestException('Tên file không hợp lệ');
    }

    const ext = path.extname(originalName).toLowerCase();
    const allowed = ALLOWED_FILE_TYPES[ext];
    if (!allowed) {
      throw new BadRequestException(
        `Định dạng file không được phép. Chỉ chấp nhận: ${Object.keys(
          ALLOWED_FILE_TYPES,
        )
          .map((e) => e.slice(1).toUpperCase())
          .join(', ')}`,
      );
    }

    // MIME do client khai báo chỉ dùng để kiểm tra chéo, không dùng để quyết định.
    const clientMime = String(data.type || '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    if (
      clientMime &&
      clientMime !== 'application/octet-stream' &&
      !allowed.clientMimes.includes(clientMime)
    ) {
      throw new BadRequestException(
        `Loại nội dung không khớp với định dạng file (${clientMime})`,
      );
    }

    const rawBase64 = String(data.base64).replace(
      /^data:[^;,]+;base64,/i,
      '',
    );
    const cleanBase64 = rawBase64.replace(/\s+/g, '');
    if (
      !cleanBase64 ||
      cleanBase64.length > Math.ceil((MAX_FILE_SIZE * 4) / 3) + 4 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(cleanBase64)
    ) {
      throw new BadRequestException('Dữ liệu base64 không hợp lệ');
    }

    const buffer = Buffer.from(cleanBase64, 'base64');
    if (buffer.length === 0) {
      throw new BadRequestException('File rỗng');
    }
    if (buffer.length > MAX_FILE_SIZE) {
      throw new BadRequestException('Dung lượng file vượt quá giới hạn 20MB');
    }
    if (allowed.isValid && !allowed.isValid(buffer)) {
      throw new BadRequestException(
        `Nội dung file không đúng định dạng ${ext.slice(1).toUpperCase()}`,
      );
    }

    // Tên ngẫu nhiên: không lộ tên gốc, không đoán được, không ghi đè lẫn nhau.
    const safeFilename = `${randomUUID()}${ext}`;
    const filePath = path.join(this.uploadDir, safeFilename);

    try {
      fs.writeFileSync(filePath, buffer, { mode: 0o644 });
      this.logger.log(
        `Đã lưu file thành công: ${safeFilename} (${buffer.length} bytes)`,
      );

      const backendUrl = (
        process.env.BACKEND_URL ||
        process.env.APP_URL ||
        'https://invoice-backend-5tbi.onrender.com'
      ).replace(/\/+$/, '');

      return {
        url: `${backendUrl}/api/upload/file/${safeFilename}`,
        name: originalName,
        size: data.size || buffer.length,
        type: allowed.mime,
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
