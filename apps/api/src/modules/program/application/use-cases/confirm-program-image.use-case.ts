import { HttpStatus, Injectable } from '@nestjs/common';
import { S3Service } from '../../../../common/s3/s3.service';
import { keyFromImageUrl } from '../../../../common/s3/s3-object.util';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { ProgramRepository } from '../../domain/repositories/program.repository';
import { ProgramImageRepository } from '../../domain/repositories/program-image.repository';

export interface ConfirmProgramImageResponseDto {
    image: {
        id: string;
        status: string;
    };
}

@Injectable()
export class ConfirmProgramImageUseCase {
    constructor(
        private readonly programs: ProgramRepository,
        private readonly images: ProgramImageRepository,
        private readonly s3: S3Service,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        programId: string,
        imageId: string,
    ): Promise<ConfirmProgramImageResponseDto> {
        // 소유권 검증: program → store → partner.userId.
        const program = await this.programs.findOwnership(programId);

        if (!program || program.storeId !== storeId) {
            throw new BusinessException(
                'PROGRAM_IMAGE_NOT_FOUND',
                '이미지를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        if (program.ownerUserId !== userId) {
            throw new BusinessException(
                'FORBIDDEN',
                '클래스 소유 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        const image = await this.images.findByProgramAndId(programId, imageId);

        if (!image) {
            throw new BusinessException(
                'PROGRAM_IMAGE_NOT_FOUND',
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

        return {
            image: {
                id: updated.id,
                status: updated.status,
            },
        };
    }
}
