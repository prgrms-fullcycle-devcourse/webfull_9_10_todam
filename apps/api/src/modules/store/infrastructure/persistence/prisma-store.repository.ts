import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { StoreSubmission } from '../../domain/entities/store-submission.entity';
import { StoreRepository, StoreStatusUpdate } from '../../domain/repositories/store.repository';

@Injectable()
export class PrismaStoreRepository extends StoreRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async findSubmission(storeId: string): Promise<StoreSubmission | null> {
        const row = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: {
                id: true,
                status: true,
                name: true,
                address: true,
                images: {
                    where: { isThumbnail: true, status: 'UPLOADED' },
                    select: { id: true },
                    take: 1,
                },
            },
        });

        return row
            ? new StoreSubmission(row.id, row.status, row.name, row.address, row.images.length > 0)
            : null;
    }

    markPending(storeId: string): Promise<StoreStatusUpdate> {
        return this.prisma.store.update({
            where: { id: storeId },
            data: { status: 'PENDING' },
            select: { id: true, status: true, updatedAt: true },
        });
    }
}
