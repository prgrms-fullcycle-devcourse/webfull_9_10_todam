import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { S3Service } from '../../../../common/s3/s3.service';
import { keyFromImageUrl } from '../../../../common/s3/s3-object.util';
import { BusinessException } from '../../../../common/exceptions/business.exception';

@Injectable()
export class DeleteStoreImageUseCase {
    constructor(
        private readonly prisma: PrismaService,
        private readonly s3: S3Service,
    ) {}

    async execute(userId: string, storeId: string, imageId: string): Promise<void> {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: { id: true, partner: { select: { userId: true } } },
        });

        if (!store) {
            throw new BusinessException(
                'STORE_NOT_FOUND',
                '공방을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 소유권 검증
        if (store.partner.userId !== userId) {
            throw new BusinessException(
                'FORBIDDEN',
                '공방 소유 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // 이미지가 해당 공방 소속인지 확인
        const image = await this.prisma.storeImage.findFirst({
            where: { id: imageId, storeId },
            select: { id: true, imageUrl: true, thumbnailUrl: true },
        });

        if (!image) {
            throw new BusinessException(
                'IMAGE_NOT_FOUND',
                '이미지를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // S3 원본·썸네일 삭제 → 실패해도 row 삭제는 진행(고아 row 방지).
        const keys = [image.imageUrl, image.thumbnailUrl]
            .filter((url): url is string => Boolean(url))
            .map((url) => keyFromImageUrl(url));

        await Promise.all(
            keys.map(async (key) => {
                try {
                    await this.s3.deleteObject(key);
                } catch {
                    // S3 삭제 실패는 무시(객체 부재 등). row 정리를 우선한다.
                }
            }),
        );

        await this.prisma.storeImage.delete({ where: { id: imageId } });
    }
}
