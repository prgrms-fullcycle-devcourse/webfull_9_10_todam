import { HttpStatus } from '@nestjs/common';
import { UpdateProgramStatusUseCase } from './update-program-status.use-case';
import type { PrismaService } from '../../../../database/prisma.service';

// PrismaService 최소 목: program.findUnique / program.update만 사용.
type ProgramRow = {
    id: string;
    storeId: string;
    status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
    store: { partner: { userId: string } };
};

function createPrismaMock(program: ProgramRow | null) {
    const update = jest.fn().mockImplementation(async ({ data }: { data: { status: string } }) => ({
        id: program?.id ?? 'prog-uuid-001',
        status: data.status,
        updatedAt: new Date('2026-05-25T19:10:00.000Z'),
    }));
    return {
        prisma: {
            program: {
                findUnique: jest.fn().mockResolvedValue(program),
                update,
            },
        } as unknown as PrismaService,
        update,
    };
}

const OWNER_ID = 'user-owner';
const STORE_ID = 'store-uuid-001';
const PROGRAM_ID = 'prog-uuid-001';

function programWith(status: ProgramRow['status'], ownerId = OWNER_ID): ProgramRow {
    return {
        id: PROGRAM_ID,
        storeId: STORE_ID,
        status,
        store: { partner: { userId: ownerId } },
    };
}

describe('UpdateProgramStatusUseCase', () => {
    describe('유효한 상태 전이', () => {
        it.each([
            ['DRAFT', 'ACTIVE'],
            ['ACTIVE', 'INACTIVE'],
            ['INACTIVE', 'ACTIVE'],
        ] as const)('%s → %s 전이를 허용한다', async (from, to) => {
            const { prisma, update } = createPrismaMock(programWith(from));
            const useCase = new UpdateProgramStatusUseCase(prisma);

            const result = await useCase.execute(OWNER_ID, STORE_ID, PROGRAM_ID, { status: to });

            expect(update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: PROGRAM_ID },
                    data: { status: to },
                }),
            );
            expect(result.program.status).toBe(to);
            expect(result.program.id).toBe(PROGRAM_ID);
            expect(result.program.updatedAt).toBe('2026-05-25T19:10:00.000Z');
        });
    });

    describe('유효하지 않은 상태 전이', () => {
        it.each([
            ['DRAFT', 'INACTIVE'],
            ['ACTIVE', 'DRAFT'],
            ['INACTIVE', 'DRAFT'],
        ] as const)('%s → %s 전이는 INVALID_STATUS_TRANSITION 으로 차단한다', async (from, to) => {
            const { prisma, update } = createPrismaMock(programWith(from));
            const useCase = new UpdateProgramStatusUseCase(prisma);

            await expect(
                useCase.execute(OWNER_ID, STORE_ID, PROGRAM_ID, { status: to }),
            ).rejects.toMatchObject({
                errorCode: 'INVALID_STATUS_TRANSITION',
                status: HttpStatus.BAD_REQUEST,
            });
            expect(update).not.toHaveBeenCalled();
        });

        it.each(['DRAFT', 'ACTIVE', 'INACTIVE'] as const)(
            '동일 상태(%s)로의 변경은 INVALID_STATUS_TRANSITION 으로 차단한다',
            async (status) => {
                const { prisma, update } = createPrismaMock(programWith(status));
                const useCase = new UpdateProgramStatusUseCase(prisma);

                await expect(
                    useCase.execute(OWNER_ID, STORE_ID, PROGRAM_ID, { status }),
                ).rejects.toMatchObject({ errorCode: 'INVALID_STATUS_TRANSITION' });
                expect(update).not.toHaveBeenCalled();
            },
        );
    });

    describe('권한 및 존재 검증', () => {
        it('타 파트너 소유 클래스는 FORBIDDEN(403)으로 차단한다', async () => {
            const { prisma, update } = createPrismaMock(programWith('DRAFT', 'user-other'));
            const useCase = new UpdateProgramStatusUseCase(prisma);

            await expect(
                useCase.execute(OWNER_ID, STORE_ID, PROGRAM_ID, { status: 'ACTIVE' }),
            ).rejects.toMatchObject({
                errorCode: 'FORBIDDEN',
                status: HttpStatus.FORBIDDEN,
            });
            expect(update).not.toHaveBeenCalled();
        });

        it('존재하지 않는 프로그램은 PROGRAM_NOT_FOUND(404)로 차단한다', async () => {
            const { prisma, update } = createPrismaMock(null);
            const useCase = new UpdateProgramStatusUseCase(prisma);

            await expect(
                useCase.execute(OWNER_ID, STORE_ID, PROGRAM_ID, { status: 'ACTIVE' }),
            ).rejects.toMatchObject({
                errorCode: 'PROGRAM_NOT_FOUND',
                status: HttpStatus.NOT_FOUND,
            });
            expect(update).not.toHaveBeenCalled();
        });

        it('storeId 불일치는 PROGRAM_NOT_FOUND(404)로 차단한다', async () => {
            const { prisma } = createPrismaMock(programWith('DRAFT'));
            const useCase = new UpdateProgramStatusUseCase(prisma);

            await expect(
                useCase.execute(OWNER_ID, 'store-other', PROGRAM_ID, { status: 'ACTIVE' }),
            ).rejects.toMatchObject({
                errorCode: 'PROGRAM_NOT_FOUND',
                status: HttpStatus.NOT_FOUND,
            });
        });
    });
});
