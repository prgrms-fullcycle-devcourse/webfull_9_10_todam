import { HttpStatus, Injectable } from '@nestjs/common';
import { S3Service } from '../../../../common/s3/s3.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { ProgramRepository } from '../../domain/repositories/program.repository';
import { ProgramImageRepository } from '../../domain/repositories/program-image.repository';

@Injectable()
export class DeleteProgramImageUseCase {
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
    ): Promise<void> {
        // 소유권 검증: program → store → partner.userId.
        const program = await this.programs.findOwnership(programId);

        if (!program || program.storeId !== storeId) {
            throw new BusinessException(
                'PROGRAM_NOT_FOUND',
                '클래스를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        if (program.ownerUserId !== userId) {
            throw new BusinessException(
                'FORBIDDEN',
                '공방 소유 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // 이미지가 해당 프로그램 소속인지 확인.
        const image = await this.images.findByProgramAndId(programId, imageId);

        if (!image) {
            throw new BusinessException(
                'IMAGE_NOT_FOUND',
                '이미지를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // S3 원본·썸네일 삭제 → 실패해도 row 삭제는 진행(고아 row 방지).
        await this.s3.deleteImageObjects([image.imageUrl, image.thumbnailUrl]);

        await this.images.delete(imageId);
    }
}
