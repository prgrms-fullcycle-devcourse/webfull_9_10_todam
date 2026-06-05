import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
    CreatePendingStoreImageInput,
    StoreImage,
    StoreImageRepository,
    StoreImageStatus,
} from '../../domain/repositories/store-image.repository';

@Injectable()
export class PrismaStoreImageRepository extends StoreImageRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    countByStore(storeId: string): Promise<number> {
        return this.prisma.storeImage.count({ where: { storeId } });
    }

    createPending(input: CreatePendingStoreImageInput): Promise<{ id: string }> {
        return this.prisma.$transaction(async (tx) => {
            if (input.isThumbnail) {
                await tx.storeImage.updateMany({
                    where: { storeId: input.storeId, isThumbnail: true },
                    data: { isThumbnail: false },
                });
            }

            return tx.storeImage.create({
                data: {
                    storeId: input.storeId,
                    imageUrl: input.imageUrl,
                    isThumbnail: input.isThumbnail,
                    status: 'PENDING',
                },
                select: { id: true },
            });
        });
    }

    findByStoreAndId(storeId: string, imageId: string): Promise<StoreImage | null> {
        return this.prisma.storeImage.findFirst({
            where: { id: imageId, storeId },
            select: { id: true, imageUrl: true, thumbnailUrl: true, status: true },
        });
    }

    async markUploaded(imageId: string): Promise<{ id: string; status: StoreImageStatus }> {
        const image = await this.prisma.storeImage.update({
            where: { id: imageId },
            data: { status: 'UPLOADED' },
            select: { id: true, status: true },
        });
        return { id: image.id, status: image.status as StoreImageStatus };
    }

    async delete(imageId: string): Promise<void> {
        await this.prisma.storeImage.delete({ where: { id: imageId } });
    }
}
