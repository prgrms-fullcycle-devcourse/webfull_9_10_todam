import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { S3Service } from '../../../../common/s3/s3.service';
import { keyFromImageUrl } from '../../../../common/s3/s3-object.util';
import { BusinessException } from '../../../../common/exceptions/business.exception';

export interface ConfirmStoreImageResponseDto {
    image: {
        id: string;
        status: string;
    };
}

@Injectable()
export class ConfirmStoreImageUseCase {
    constructor(
        private readonly prisma: PrismaService,
        private readonly s3: S3Service,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        imageId: string,
    ): Promise<ConfirmStoreImageResponseDto> {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: { id: true, partner: { select: { userId: true } } },
        });

        if (!store) {
            throw new BusinessException(
                'NOT_FOUND',
                '공방을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        if (store.partner.userId !== userId) {
            throw new BusinessException(
                'FORBIDDEN',
                '공방 소유 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        const image = await this.prisma.storeImage.findUnique({
            where: { id: imageId },
            select: { id: true, status: true, imageUrl: true },
        });

        if (!image) {
            throw new BusinessException(
                'NOT_FOUND',
                '이미지를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        if (image.status === 'UPLOADED') {
            throw new BusinessException(
                'ALREADY_UPLOADED',
                '이미 업로드 확인된 이미지입니다.',
                HttpStatus.CONFLICT,
            );
        }

        const uploaded = await this.s3.objectExists(keyFromImageUrl(image.imageUrl));
        if (!uploaded) {
            throw new BusinessException(
                'IMAGE_NOT_UPLOADED',
                'S3에 업로드된 이미지를 찾을 수 없습니다. 업로드를 먼저 완료해주세요.',
                HttpStatus.BAD_REQUEST,
            );
        }

        const updated = await this.prisma.storeImage.update({
            where: { id: imageId },
            data: { status: 'UPLOADED' },
            select: { id: true, status: true },
        });

        return {
            image: {
                id: updated.id,
                status: updated.status,
            },
        };
    }
}
