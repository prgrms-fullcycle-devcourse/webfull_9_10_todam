import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
    PartnerStoreProgramsReader,
    PartnerStoreProgramsResult,
} from '../../domain/repositories/program-readers';
import type {
    ProgramDifficulty,
    ProgramStatus,
} from '../../domain/repositories/program.repository';

@Injectable()
export class PrismaPartnerStoreProgramsReader extends PartnerStoreProgramsReader {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async execute(storeId: string): Promise<PartnerStoreProgramsResult> {
        // 파트너센터용: class status enum 전체 포함 (DRAFT/ACTIVE/INACTIVE), ACTIVE 필터링 안 함.
        const programs = await this.prisma.program.findMany({
            where: { storeId },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
            select: {
                id: true,
                title: true,
                price: true,
                durationMinutes: true,
                difficulty: true,
                leadTimeDays: true,
                deliverable: true,
                status: true,
            },
        });

        return {
            programs: programs.map((program) => ({
                id: program.id,
                title: program.title,
                price: program.price,
                durationMinutes: program.durationMinutes,
                difficulty: program.difficulty as ProgramDifficulty,
                leadTimeDays: program.leadTimeDays,
                deliverable: program.deliverable,
                status: program.status as ProgramStatus,
            })),
        };
    }
}
