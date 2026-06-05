import { Injectable } from '@nestjs/common';
import { S3Service } from '../../../../common/s3/s3.service';
import { buildObjectKey, CDN_BASE } from '../../../../common/s3/s3-object.util';
import type {
    CreateBusinessDocumentImageCommand,
    CreateBusinessDocumentImageResult,
} from '../dto/store-application.dto';

@Injectable()
export class CreateBusinessDocumentImageUseCase {
    constructor(private readonly s3: S3Service) {}

    async execute(
        userId: string,
        dto: CreateBusinessDocumentImageCommand,
    ): Promise<CreateBusinessDocumentImageResult> {
        // store-비종속: store 생성 전에 업로드되므로 storeId 없이 userId로 key 생성.
        // DB row 선생성·confirm 핸드셰이크 없음 — 객체 존재 검증은 POST /stores에서 수행.
        const key = buildObjectKey(`business-documents/${userId}`, dto.fileType, dto.fileName);

        const { uploadUrl } = await this.s3.createPresignedPutUrl(key, dto.fileType, 300);

        const documentUrl = `${CDN_BASE}/${key}`;

        return { uploadUrl, documentUrl };
    }
}
