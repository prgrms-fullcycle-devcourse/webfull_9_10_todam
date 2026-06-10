import { HttpStatus, Injectable } from '@nestjs/common';
import { StoreStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import {
    ProgramDetailResult,
    PublicProgramDetailReader,
} from '../../domain/repositories/program-readers';
import type {
    ProgramDifficulty,
    ProgramStatus,
} from '../../domain/repositories/program.repository';

@Injectable()
export class PrismaPublicProgramDetailReader extends PublicProgramDetailReader {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async execute(programId: string): Promise<ProgramDetailResult> {
        // 퍼블릭 조회: programId 단독 식별. ACTIVE 클래스 + store PUBLISHED 만 노출
        // (DRAFT/INACTIVE 클래스 및 비공개 store 은폐 — 가시성 가드).
        const program = await this.prisma.program.findFirst({
            where: {
                id: programId,
                status: 'ACTIVE',
                store: { status: StoreStatus.PUBLISHED },
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
                // name 은 상세 헤더/공유 텍스트용(라우트에 slug 미포함).
                store: { select: { maxCapacityPerSlot: true, name: true } },
                // serve-UPLOADED-only 정책: PENDING/FAILED 이미지는 은폐.
                images: {
                    where: { status: 'UPLOADED' },
                    orderBy: { sortOrder: 'asc' },
                    select: { imageUrl: true },
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
                storeName: program.store.name,
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
                difficulty: program.difficulty as ProgramDifficulty,
                status: program.status as ProgramStatus,
                images: program.images.map((image) => ({
                    imageUrl: image.imageUrl,
                })),
            },
        };
    }
}
