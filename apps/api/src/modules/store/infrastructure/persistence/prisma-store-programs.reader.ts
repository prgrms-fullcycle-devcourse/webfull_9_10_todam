import { HttpStatus, Injectable } from '@nestjs/common';
import { ImageUploadStatus, ProgramStatus, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type { ListStoreProgramsResponseDto } from '../../presentation/dto/list-store-programs.dto';

@Injectable()
export class PrismaStoreProgramsReader {
    constructor(private readonly prisma: PrismaService) {}

    async execute(slug: string): Promise<ListStoreProgramsResponseDto> {
        const store = await this.prisma.store.findUnique({
            where: { slug },
            select: { id: true, status: true },
        });

        // 미존재 또는 PUBLISHED 아님 → 404 STORE_NOT_FOUND.
        if (!store || store.status !== StoreStatus.PUBLISHED) {
            throw new BusinessException(
                'STORE_NOT_FOUND',
                '공방을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // ACTIVE 프로그램만, sortOrder → id 오름차순.
        const programs = await this.prisma.program.findMany({
            where: { storeId: store.id, status: ProgramStatus.ACTIVE },
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
            select: {
                id: true,
                title: true,
                difficulty: true,
                description: true,
                price: true,
                durationMinutes: true,
                leadTimeDays: true,
                deliverable: true,
                status: true,
                sortOrder: true,
                // 대표 썸네일: UPLOADED 이미지 중 sortOrder 최상위 1건.
                images: {
                    where: { status: ImageUploadStatus.UPLOADED },
                    orderBy: { sortOrder: 'asc' },
                    take: 1,
                    select: { imageUrl: true, thumbnailUrl: true },
                },
            },
        });

        return {
            programs: programs.map((program) => {
                const image = program.images[0];
                const thumbnailUrl = image ? (image.thumbnailUrl ?? image.imageUrl ?? null) : null;
                return {
                    id: program.id,
                    title: program.title,
                    difficulty: program.difficulty,
                    description: program.description ?? '',
                    price: program.price,
                    durationMinutes: program.durationMinutes,
                    leadTimeDays: program.leadTimeDays,
                    deliverable: program.deliverable,
                    thumbnailUrl,
                    status: program.status,
                    sortOrder: program.sortOrder,
                };
            }),
        };
    }
}
