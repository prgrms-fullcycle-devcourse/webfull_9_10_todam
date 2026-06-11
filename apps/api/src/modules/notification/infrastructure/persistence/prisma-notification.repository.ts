import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
    NotificationRepository,
    NotificationRow,
} from '../../domain/repositories/notification.repository';
import { decodeCursor } from '../../domain/notification-cursor';

function toRow(row: {
    id: string;
    userId: string;
    eventType: string;
    category: string;
    title: string;
    body: string;
    deepLink: string | null;
    idempotencyKey: string;
    readAt: Date | null;
    createdAt: Date;
}): NotificationRow {
    return {
        id: row.id,
        userId: row.userId,
        eventType: row.eventType,
        category: row.category as NotificationRow['category'],
        title: row.title,
        body: row.body,
        deepLink: row.deepLink,
        idempotencyKey: row.idempotencyKey,
        readAt: row.readAt,
        createdAt: row.createdAt,
    };
}

@Injectable()
export class PrismaNotificationRepository extends NotificationRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async listByUser(params: {
        userId: string;
        cursor?: string;
        limit: number;
        unreadOnly?: boolean;
    }): Promise<{ notifications: NotificationRow[]; unreadCount: number }> {
        const { userId, cursor, limit, unreadOnly } = params;

        // 커서 디코딩
        const decoded = cursor ? decodeCursor(cursor) : null;

        const baseWhere = {
            userId,
            ...(unreadOnly ? { readAt: null } : {}),
        };

        // 커서 기반 where: (createdAt, id) 복합 커서 (createdAt DESC, id DESC stable sort)
        const cursorWhere = decoded
            ? {
                  OR: [
                      { createdAt: { lt: new Date(decoded.createdAt) } },
                      {
                          createdAt: { equals: new Date(decoded.createdAt) },
                          id: { lt: decoded.id },
                      },
                  ],
              }
            : {};

        const [rows, unreadCount] = await this.prisma.$transaction([
            this.prisma.notification.findMany({
                where: { ...baseWhere, ...cursorWhere },
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                take: limit,
                select: {
                    id: true,
                    userId: true,
                    eventType: true,
                    category: true,
                    title: true,
                    body: true,
                    deepLink: true,
                    idempotencyKey: true,
                    readAt: true,
                    createdAt: true,
                },
            }),
            this.prisma.notification.count({
                where: { userId, readAt: null },
            }),
        ]);

        return {
            notifications: rows.map(toRow),
            unreadCount,
        };
    }

    async findById(id: string): Promise<NotificationRow | null> {
        const row = await this.prisma.notification.findUnique({
            where: { id },
            select: {
                id: true,
                userId: true,
                eventType: true,
                category: true,
                title: true,
                body: true,
                deepLink: true,
                idempotencyKey: true,
                readAt: true,
                createdAt: true,
            },
        });
        return row ? toRow(row) : null;
    }

    async markRead(id: string): Promise<NotificationRow> {
        const row = await this.prisma.notification.update({
            where: { id },
            data: { readAt: new Date() },
            select: {
                id: true,
                userId: true,
                eventType: true,
                category: true,
                title: true,
                body: true,
                deepLink: true,
                idempotencyKey: true,
                readAt: true,
                createdAt: true,
            },
        });
        return toRow(row);
    }

    async markAllRead(userId: string): Promise<number> {
        const result = await this.prisma.notification.updateMany({
            where: { userId, readAt: null },
            data: { readAt: new Date() },
        });
        return result.count;
    }
}
