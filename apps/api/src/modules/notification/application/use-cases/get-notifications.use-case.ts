import { Injectable } from '@nestjs/common';
import {
    NotificationRepository,
    NotificationRow,
} from '../../domain/repositories/notification.repository';
import { encodeCursor } from '../../domain/notification-cursor';

export interface GetNotificationsResult {
    notifications: Array<{
        id: string;
        recipientId: string;
        eventType: string;
        category: 'TRANSACTION' | 'ARTWORK' | 'DELIVERY' | 'OPERATION' | 'ENGAGEMENT';
        title: string;
        body: string;
        deepLink?: string;
        idempotencyKey: string;
        readAt: string | null;
        createdAt: string;
    }>;
    nextCursor: string | null;
    unreadCount: number;
}

function rowToDto(row: NotificationRow): GetNotificationsResult['notifications'][number] {
    return {
        id: row.id,
        recipientId: row.userId,
        eventType: row.eventType,
        category: row.category,
        title: row.title,
        body: row.body,
        ...(row.deepLink != null ? { deepLink: row.deepLink } : {}),
        idempotencyKey: row.idempotencyKey,
        readAt: row.readAt ? row.readAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
    };
}

@Injectable()
export class GetNotificationsUseCase {
    constructor(private readonly notifications: NotificationRepository) {}

    async execute(params: {
        userId: string;
        cursor?: string;
        limit: number;
        unreadOnly?: boolean;
    }): Promise<GetNotificationsResult> {
        const { notifications: rows, unreadCount } = await this.notifications.listByUser({
            userId: params.userId,
            cursor: params.cursor,
            limit: params.limit,
            unreadOnly: params.unreadOnly,
        });

        // nextCursor: 마지막 row의 (createdAt, id) 기반 — 결과가 limit 개이면 다음 페이지 있음
        const lastRow = rows.length === params.limit ? rows[rows.length - 1] : undefined;
        const nextCursor = lastRow
            ? encodeCursor({
                  createdAt: lastRow.createdAt.toISOString(),
                  id: lastRow.id,
              })
            : null;

        return {
            notifications: rows.map(rowToDto),
            nextCursor,
            unreadCount,
        };
    }
}
