import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile() {
    return {
      name: 'Admin Tetrasco',
      email: 'admin@airobotics.edu.vn',
      role: 'ADMIN',
    };
  }
}
