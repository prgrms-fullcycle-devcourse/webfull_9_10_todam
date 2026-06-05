import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { S3Service } from '../../../../common/s3/s3.service';
import { CDN_BASE } from '../../../../common/s3/s3-object.util';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { ProgramRepository } from '../../domain/repositories/program.repository';
import { ProgramImageRepository } from '../../domain/repositories/program-image.repository';
import type {
    CreateProgramImageDto,
    CreateProgramImageResponseDto,
} from '../../presentation/dto/program-image.dto';

// 클래스 이미지 지원 형식: JPG, PNG, HEIC (계약 명세).
const ALLOWED_FILE_TYPES: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/heic': 'heic',
};

@Injectable()
export class CreateProgramImageUseCase {
    constructor(
        private readonly programs: ProgramRepository,
        private readonly images: ProgramImageRepository,
        private readonly s3: S3Service,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        programId: string,
        dto: CreateProgramImageDto,
    ): Promise<CreateProgramImageResponseDto> {
        const ext = ALLOWED_FILE_TYPES[dto.fileType];
        if (!ext) {
            throw new BusinessException(
                'INVALID_FILE_TYPE',
                '지원하지 않는 파일 형식입니다. JPG, PNG, HEIC만 업로드할 수 있습니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        const program = await this.programs.findOwnership(programId);

        if (!program || program.storeId !== storeId) {
            throw new BusinessException(
                'PROGRAM_NOT_FOUND',
                '클래스를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 공방 소유 권한 검증.
        if (program.ownerUserId !== userId) {
            throw new BusinessException(
                'FORBIDDEN',
                '공방 소유 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        const key = `programs/${programId}/images/${randomUUID()}.${ext}`;
        const { uploadUrl } = await this.s3.createPresignedPutUrl(key, dto.fileType, 300);
        const imageUrl = `${CDN_BASE}/${key}`;

        const image = await this.images.createPending({
            programId,
            imageUrl,
            isThumbnail: dto.isThumbnail,
        });

        return {
            programImageId: image.id,
            uploadUrl,
            imageUrl,
        };
    }
}
