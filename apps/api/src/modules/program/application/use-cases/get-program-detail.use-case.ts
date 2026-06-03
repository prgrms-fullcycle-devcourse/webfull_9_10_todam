import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { ErrorCode } from '../../../../common/constants/error-code';
import type { GetProgramDetailResponseDto } from '../../presentation/dto/get-program-detail.dto';

@Injectable()
export class GetProgramDetailUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(
        userId: string,
        storeId: string,
        programId: string,
    ): Promise<GetProgramDetailResponseDto> {
        const program = await this.prisma.program.findUnique({
            where: { id: programId },
            select: {
                id: true,
                storeId: true,
                title: true,
                description: true,
                materials: true,
                caution: true,
                price: true,
                durationMinutes: true,
                leadTimeDays: true,
                deliverable: true,
                childFriendly: true,
                difficulty: true,
                status: true,
                store: { select: { partner: { select: { userId: true } } } },
                // serve-UPLOADED-only 정책: PENDING/FAILED 이미지는 은폐.
                images: {
                    where: { status: 'UPLOADED' },
                    orderBy: { sortOrder: 'asc' },
                    select: { imageUrl: true, thumbnailUrl: true },
                },
            },
        });

        if (!program || program.storeId !== storeId) {
            throw new BusinessException(
                'PROGRAM_NOT_FOUND',
                '클래스를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 공방 소유 권한 검증 — 타 파트너 접근 시 403.
        if (program.store.partner.userId !== userId) {
            throw new BusinessException(
                ErrorCode.FORBIDDEN,
                '공방 소유 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        return {
            program: {
                id: program.id,
                storeId: program.storeId,
                title: program.title,
                description: program.description,
                materials: program.materials,
                caution: program.caution,
                price: program.price,
                durationMinutes: program.durationMinutes,
                leadTimeDays: program.leadTimeDays,
                deliverable: program.deliverable,
                childFriendly: program.childFriendly,
                difficulty: program.difficulty,
                status: program.status,
                images: program.images.map((image) => ({
                    imageUrl: image.imageUrl,
                    thumbnailUrl: image.thumbnailUrl,
                })),
            },
        };
    }
}
