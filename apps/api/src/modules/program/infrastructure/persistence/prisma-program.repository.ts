import { Injectable } from '@nestjs/common';
import { Prisma, ProgramDifficulty as PrismaProgramDifficulty } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import {
    CreateProgramInput,
    CreatedProgram,
    ProgramOrder,
    ProgramOwnership,
    ProgramRepository,
    UpdateProgramFields,
    UpdatedProgram,
    UpdatedProgramStatus,
    ProgramStatus,
} from '../../domain/repositories/program.repository';

@Injectable()
export class PrismaProgramRepository extends ProgramRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async findOwnership(programId: string): Promise<ProgramOwnership | null> {
        const program = await this.prisma.program.findUnique({
            where: { id: programId },
            select: {
                id: true,
                storeId: true,
                status: true,
                price: true,
                leadTimeDays: true,
                store: { select: { partner: { select: { userId: true } } } },
            },
        });

        if (!program) return null;

        return {
            id: program.id,
            storeId: program.storeId,
            ownerUserId: program.store.partner.userId,
            status: program.status as ProgramStatus,
            price: program.price,
            leadTimeDays: program.leadTimeDays,
        };
    }

    async create(storeId: string, input: CreateProgramInput): Promise<CreatedProgram> {
        // programs + program_snapshots 동시 생성. 등록 시 status = ACTIVE (DRAFT 생략 결정).
        const program = await this.prisma.$transaction(async (tx) => {
            const created = await tx.program.create({
                data: {
                    storeId,
                    title: input.title,
                    description: input.description,
                    materials: input.materials,
                    caution: input.caution,
                    price: input.price,
                    durationMinutes: input.durationMinutes,
                    difficulty: input.difficulty as PrismaProgramDifficulty,
                    childFriendly: input.childFriendly,
                    leadTimeDays: input.leadTimeDays,
                    deliverable: input.deliverable,
                    status: 'ACTIVE',
                },
                select: {
                    id: true,
                    storeId: true,
                    title: true,
                    status: true,
                    createdAt: true,
                },
            });

            await tx.programSnapshot.create({
                data: {
                    programId: created.id,
                    price: input.price,
                    leadTimeDays: input.leadTimeDays,
                },
            });

            return created;
        });

        return {
            id: program.id,
            storeId: program.storeId,
            title: program.title,
            status: program.status as ProgramStatus,
            createdAt: program.createdAt,
        };
    }

    async update(
        programId: string,
        fields: UpdateProgramFields,
        createSnapshot: boolean,
    ): Promise<UpdatedProgram> {
        // 전송된 필드만 data 에 반영(partial update).
        const data: Prisma.ProgramUpdateInput = {};
        if (fields.title !== undefined) data.title = fields.title;
        if (fields.description !== undefined) data.description = fields.description;
        if (fields.materials !== undefined) data.materials = fields.materials;
        if (fields.caution !== undefined) data.caution = fields.caution;
        if (fields.price !== undefined) data.price = fields.price;
        if (fields.leadTimeDays !== undefined) data.leadTimeDays = fields.leadTimeDays;
        if (fields.durationMinutes !== undefined) data.durationMinutes = fields.durationMinutes;
        if (fields.difficulty !== undefined) {
            data.difficulty = fields.difficulty as PrismaProgramDifficulty;
        }
        if (fields.childFriendly !== undefined) data.childFriendly = fields.childFriendly;
        if (fields.deliverable !== undefined) data.deliverable = fields.deliverable;

        const updated = await this.prisma.$transaction(async (tx) => {
            const result = await tx.program.update({
                where: { id: programId },
                data,
                select: {
                    id: true,
                    title: true,
                    price: true,
                    leadTimeDays: true,
                    status: true,
                    updatedAt: true,
                },
            });

            // 가격/리드타임이 실제로 바뀌고 기존 예약이 1건 이상이면 스냅샷 신규 row 생성.
            // 스냅샷 값은 트랜잭션 내부 갱신 결과(result)에서 취해 stale read 를 방지한다.
            if (createSnapshot) {
                const reservationCount = await tx.reservation.count({ where: { programId } });
                if (reservationCount > 0) {
                    await tx.programSnapshot.create({
                        data: {
                            programId,
                            price: result.price,
                            leadTimeDays: result.leadTimeDays,
                        },
                    });
                }
            }

            return result;
        });

        return {
            id: updated.id,
            title: updated.title,
            price: updated.price,
            status: updated.status as ProgramStatus,
            updatedAt: updated.updatedAt,
        };
    }

    async updateStatus(programId: string, status: ProgramStatus): Promise<UpdatedProgramStatus> {
        const updated = await this.prisma.program.update({
            where: { id: programId },
            data: { status },
            select: { id: true, status: true, updatedAt: true },
        });

        return {
            id: updated.id,
            status: updated.status as ProgramStatus,
            updatedAt: updated.updatedAt,
        };
    }

    async listIds(storeId: string): Promise<string[]> {
        const programs = await this.prisma.program.findMany({
            where: { storeId },
            select: { id: true },
        });
        return programs.map((p) => p.id);
    }

    async reorder(orders: ProgramOrder[]): Promise<void> {
        // 트랜잭션: sortOrder 일괄 갱신, 실패 시 전체 rollback.
        await this.prisma.$transaction(
            orders.map((order) =>
                this.prisma.program.update({
                    where: { id: order.id },
                    data: { sortOrder: order.sortOrder },
                }),
            ),
        );
    }
}
