import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../../database/prisma.service';
import { S3Service } from '../../../../common/s3/s3.service';
import { CDN_BASE } from '../../../../common/s3/s3-object.util';
import { BusinessException } from '../../../../common/exceptions/business.exception';
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
        private readonly prisma: PrismaService,
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

        // 공방 소유 권한 검증.
        if (program.store.partner.userId !== userId) {
            throw new BusinessException(
                'FORBIDDEN',
                '공방 소유 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        const key = `programs/${programId}/images/${randomUUID()}.${ext}`;

        const { uploadUrl } = await this.s3.createPresignedPutUrl(key, dto.fileType, 300);

        const imageUrl = `${CDN_BASE}/${key}`;

        // 대표 이미지(isThumbnail)는 클래스당 최대 1개 불변식. 새 대표 등록 시 기존 대표를
        // 모두 내린 뒤 row 를 선 생성한다(트랜잭션). 상태는 PENDING(업로드 대기).
        const image = await this.prisma.$transaction(async (tx) => {
            if (dto.isThumbnail) {
                await tx.programImage.updateMany({
                    where: { programId, isThumbnail: true },
                    data: { isThumbnail: false },
                });
            }

            return tx.programImage.create({
                data: {
                    programId,
                    imageUrl,
                    isThumbnail: dto.isThumbnail,
                    status: 'PENDING',
                },
                select: { id: true },
            });
        });

        return {
            programImageId: image.id,
            uploadUrl,
            imageUrl,
        };
    }
}
