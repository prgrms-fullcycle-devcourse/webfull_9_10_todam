import { HttpStatus, Injectable } from '@nestjs/common';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { S3Service } from '../../../../common/s3/s3.service';
import { keyFromImageUrl } from '../../../../common/s3/s3-object.util';
import { StoreImageRepository } from '../../domain/repositories/store-image.repository';

export interface ConfirmStoreImageResponseDto {
    image: {
        id: string;
        status: string;
    };
}

@Injectable()
export class ConfirmStoreImageUseCase {
    constructor(
        private readonly ownership: StoreOwnershipService,
        private readonly images: StoreImageRepository,
        private readonly s3: S3Service,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        imageId: string,
    ): Promise<ConfirmStoreImageResponseDto> {
        await this.ownership.verify(userId, storeId, { notFound: 'NOT_FOUND' });

        const image = await this.images.findByStoreAndId(storeId, imageId);
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

        const updated = await this.images.markUploaded(imageId);
        return { image: updated };
    }
}
