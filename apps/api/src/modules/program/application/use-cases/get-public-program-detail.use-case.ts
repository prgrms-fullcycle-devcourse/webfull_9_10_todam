import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type { GetProgramDetailResponseDto } from '../../presentation/dto/get-program-detail.dto';

@Injectable()
export class GetPublicProgramDetailUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(slug: string, programId: string): Promise<GetProgramDetailResponseDto> {
        // 퍼블릭 조회: 공방 slug로 식별, ACTIVE 클래스만 노출(DRAFT/INACTIVE 은폐).
        const program = await this.prisma.program.findFirst({
            where: {
                id: programId,
                status: 'ACTIVE',
                store: { slug },
            },
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
                // 정원은 공방 단위(Store.maxCapacityPerSlot) — 클래스 상세 "정원 최대 N명".
                store: { select: { maxCapacityPerSlot: true } },
                // serve-UPLOADED-only 정책: PENDING/FAILED 이미지는 은폐.
                images: {
                    where: { status: 'UPLOADED' },
                    orderBy: { sortOrder: 'asc' },
                    select: { imageUrl: true, thumbnailUrl: true },
                },
            },
        });

        if (!program) {
            throw new BusinessException(
                'PROGRAM_NOT_FOUND',
                '클래스를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
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
                capacity: program.store.maxCapacityPerSlot,
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
