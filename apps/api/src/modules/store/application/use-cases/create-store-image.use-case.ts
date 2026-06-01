import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { S3Service } from '../../../../common/s3/s3.service';
import { buildObjectKey, CDN_BASE } from '../../../../common/s3/s3-object.util';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type {
    CreateStoreImageDto,
    CreateStoreImageResponseDto,
} from '../../presentation/dto/store-image.dto';

@Injectable()
export class CreateStoreImageUseCase {
    constructor(
        private readonly prisma: PrismaService,
        private readonly s3: S3Service,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        dto: CreateStoreImageDto,
    ): Promise<CreateStoreImageResponseDto> {
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

        const key = buildObjectKey(`stores/${storeId}/images`, dto.fileType, dto.fileName);

        const { uploadUrl } = await this.s3.createPresignedPutUrl(key, dto.fileType, 300);

        const imageUrl = `${CDN_BASE}/${key}`;

        const image = await this.prisma.storeImage.create({
            data: {
                storeId,
                imageUrl,
                isThumbnail: dto.isThumbnail,
                status: 'PENDING',
            },
            select: { id: true },
        });

        return {
            imageId: image.id,
            uploadUrl,
            imageUrl,
        };
    }
}
