import { HttpStatus, Injectable } from '@nestjs/common';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { S3Service } from '../../../../common/s3/s3.service';
import { StoreImageRepository } from '../../domain/repositories/store-image.repository';

@Injectable()
export class DeleteStoreImageUseCase {
    constructor(
        private readonly ownership: StoreOwnershipService,
        private readonly images: StoreImageRepository,
        private readonly s3: S3Service,
    ) {}

    async execute(userId: string, storeId: string, imageId: string): Promise<void> {
        await this.ownership.verify(userId, storeId, { notFound: 'STORE_NOT_FOUND' });

        const image = await this.images.findByStoreAndId(storeId, imageId);
        if (!image) {
            throw new BusinessException(
                'IMAGE_NOT_FOUND',
                '이미지를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        await this.s3.deleteImageObjects([image.imageUrl]);
        await this.images.delete(imageId);
    }
}
