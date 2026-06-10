import { Injectable } from '@nestjs/common';
import { ReviewImageUploadRequest, ReviewImageUploadResult } from '@todam/shared';
import { S3Service } from '../../../../common/s3/s3.service';
import { buildObjectKey } from '../../../../common/s3/s3-object.util';

const PRESIGNED_TTL_SECONDS = 300;
const REVIEW_PHOTO_PREFIX = 'reviews/photos';

@Injectable()
export class IssueReviewImagePresignedUseCase {
    constructor(private readonly s3: S3Service) {}

    async execute(dto: ReviewImageUploadRequest): Promise<ReviewImageUploadResult> {
        const key = buildObjectKey(REVIEW_PHOTO_PREFIX, dto.fileType, dto.fileName);
        const { uploadUrl } = await this.s3.createPresignedPutUrl(
            key,
            dto.fileType,
            PRESIGNED_TTL_SECONDS,
        );
        return { uploadUrl, key };
    }
}
