import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { PaginationDto, PaginatedResult } from './dto/pagination.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async getMyNotifications(userId: string, pagination?: PaginationDto): Promise<PaginatedResult<Notification>> {
    const limit = pagination?.limit ? Number(pagination.limit) : 10;
    const page = pagination?.page ? Number(pagination.page) : 1;
    const skip = (page - 1) * limit;

    const [data, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const unreadCount = await this.notificationRepo.count({
      where: { userId, isRead: false },
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      // @ts-ignore
      unreadCount, // Tambahan ekstra metadata
    };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notif = await this.notificationRepo.findOne({
      where: { id, userId },
    });

    if (!notif) {
      throw new NotFoundException('Notifikasi tidak ditemukan');
    }

    notif.isRead = true;
    return this.notificationRepo.save(notif);
  }

  async markAllAsRead(userId: string): Promise<{ affected: number }> {
    const result = await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return { affected: result.affected ?? 0 };
  }
}
