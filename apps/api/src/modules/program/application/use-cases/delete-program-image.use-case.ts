import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { S3Service } from '../../../../common/s3/s3.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';

@Injectable()
export class DeleteProgramImageUseCase {
    constructor(
        private readonly prisma: PrismaService,
        private readonly s3: S3Service,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        programId: string,
        imageId: string,
    ): Promise<void> {
        // 소유권 검증: program → store → partner.userId.
        const program = await this.prisma.program.findUnique({
            where: { id: programId },
            select: {
                id: true,
                storeId: true,
                store: { select: { partner: { select: { userId: true } } } },
            },
        });

        if (!program || program.storeId !== storeId) {
            throw new BusinessException(
                'PROGRAM_NOT_FOUND',
                '클래스를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        if (program.store.partner.userId !== userId) {
            throw new BusinessException(
                'FORBIDDEN',
                '공방 소유 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // 이미지가 해당 프로그램 소속인지 확인.
        const image = await this.prisma.programImage.findFirst({
            where: { id: imageId, programId },
            select: { id: true, imageUrl: true, thumbnailUrl: true },
        });

        if (!image) {
            throw new BusinessException(
                'IMAGE_NOT_FOUND',
                '이미지를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // S3 원본·썸네일 삭제 → 실패해도 row 삭제는 진행(고아 row 방지).
        await this.s3.deleteImageObjects([image.imageUrl, image.thumbnailUrl]);

        await this.prisma.programImage.delete({ where: { id: imageId } });
    }
}
