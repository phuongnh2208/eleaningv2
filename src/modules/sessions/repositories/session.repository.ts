import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { SessionStatus } from 'src/generated/prisma/client';

@Injectable()
export class SessionRepository {
  constructor(private readonly prismaService: PrismaService) {}
  async create(data: {
    userID: number;
    refreshTokenHash: string;
    status?: SessionStatus;
  }) {
    return await this.prismaService.session.create({
      data: {
        userId: data.userID,
        refreshTokenHash: data.refreshTokenHash,
        status: data.status ?? SessionStatus.ACTIVE,
      },
    });
  }
  // Lọc ra thằng mới nhất và duy nhất của mỗi trạng thái
  async findLatestByUserId(userId: number) {
    return await this.prismaService.session.findFirst({
      where: { userId },
      orderBy: { id: 'desc' },
    });
  }
  async findActiveByUserId(userId: number) {
    return await this.prismaService.session.findFirst({
      where: {
        userId,
        status: SessionStatus.ACTIVE,
      },
    });
  } // Sử dụng để tìm kiếm các session nào của 1 user đang đăng nhập đang hợp lệ
  async findById(id: number) {
    return await this.prismaService.session.findUnique({
      where: { id },
    });
  }
  async updateStatus(id: number, status: SessionStatus) {
    return await this.prismaService.session.update({
      where: { id },
      data: { status },
    });
  }
  async revokeAllActiveByUserId(userId: number) {
    return await this.prismaService.session.updateMany({
      where: { userId, status: SessionStatus.ACTIVE },
      data: { status: SessionStatus.REVOKED },
    });
  } // Set trạng thái revoke của session userID này -> hủy hết
  async delete(id: number) {
    return await this.prismaService.session.delete({
      where: { id },
    });
  }
}
