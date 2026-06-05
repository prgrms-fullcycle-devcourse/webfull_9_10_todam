import { Injectable } from '@nestjs/common';
import { calcDisplayState } from '../../domain/display-state.util';
import { UserReservationRepository } from '../../domain/repositories/user-reservation.repository';
import type {
    GetMyReservationsQueryDto,
    MyReservationsResponseDto,
} from '../../presentation/dto/user-reservation.dto';

@Injectable()
export class ListUserReservationsUseCase {
    constructor(private readonly reservations: UserReservationRepository) {}

    async execute(
        userId: string,
        query: GetMyReservationsQueryDto,
    ): Promise<MyReservationsResponseDto> {
        const limit = query.limit ?? 20;

        const rows = await this.reservations.findMyList(userId, {
            status: query.status,
            cursor: query.cursor,
            limit,
        });

        const page = rows.slice(0, limit);
        const hasMore = rows.length > limit;

        return {
            reservations: page.map((row) => ({
                id: row.id,
                storeName: row.storeName,
                programTitle: row.programTitle,
                scheduledAt: row.scheduledAt.toISOString(),
                participantCount: row.participantCount,
                status: row.status,
                displayState: calcDisplayState(row.status, row.artworkStatus),
                createdAt: row.createdAt.toISOString(),
            })),
            nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
            hasMore,
        };
    }
}
