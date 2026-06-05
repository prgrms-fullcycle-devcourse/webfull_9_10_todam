import { HttpStatus, Injectable } from '@nestjs/common';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { S3Service } from '../../../../common/s3/s3.service';
import { buildObjectKey, CDN_BASE } from '../../../../common/s3/s3-object.util';
import { StoreImageRepository } from '../../domain/repositories/store-image.repository';
import { StoreImagePolicy } from '../../domain/services/store-image-policy.service';
import type { CreateStoreImageCommand, CreateStoreImageResult } from '../dto/store-application.dto';

@Injectable()
export class CreateStoreImageUseCase {
    constructor(
        private readonly ownership: StoreOwnershipService,
        private readonly images: StoreImageRepository,
        private readonly s3: S3Service,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        dto: CreateStoreImageCommand,
    ): Promise<CreateStoreImageResult> {
        await this.ownership.verify(userId, storeId, { notFound: 'NOT_FOUND' });

        const imageCount = await this.images.countByStore(storeId);
        if (!StoreImagePolicy.canAdd(imageCount)) {
            throw new BusinessException(
                'IMAGE_LIMIT_EXCEEDED',
                `공방 대표 이미지는 최대 ${StoreImagePolicy.MAX_IMAGES}장까지 등록할 수 있습니다.`,
                HttpStatus.BAD_REQUEST,
            );
        }

        const key = buildObjectKey(`stores/${storeId}/images`, dto.fileType, dto.fileName);
        const { uploadUrl } = await this.s3.createPresignedPutUrl(key, dto.fileType, 300);
        const imageUrl = `${CDN_BASE}/${key}`;
        const image = await this.images.createPending({
            storeId,
            imageUrl,
            isThumbnail: dto.isThumbnail,
        });

        return {
            imageId: image.id,
            uploadUrl,
            imageUrl,
        };
    }
}
