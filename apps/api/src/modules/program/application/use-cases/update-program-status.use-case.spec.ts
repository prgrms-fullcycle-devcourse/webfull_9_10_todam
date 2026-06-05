import { HttpStatus } from '@nestjs/common';
import { UpdateProgramStatusUseCase } from './update-program-status.use-case';
import type {
    ProgramOwnership,
    ProgramRepository,
    ProgramStatus,
} from '../../domain/repositories/program.repository';

// ProgramRepository 최소 목: findOwnership / updateStatus 만 사용.
function createRepositoryMock(ownership: ProgramOwnership | null) {
    const updateStatus = jest
        .fn()
        .mockImplementation(async (programId: string, status: ProgramStatus) => ({
            id: programId,
            status,
            updatedAt: new Date('2026-05-25T19:10:00.000Z'),
        }));
    return {
        repository: {
            findOwnership: jest.fn().mockResolvedValue(ownership),
            updateStatus,
        } as unknown as ProgramRepository,
        updateStatus,
    };
}

const OWNER_ID = 'user-owner';
const STORE_ID = 'store-uuid-001';
const PROGRAM_ID = 'prog-uuid-001';

function ownershipWith(status: ProgramStatus, ownerUserId = OWNER_ID): ProgramOwnership {
    return {
        id: PROGRAM_ID,
        storeId: STORE_ID,
        ownerUserId,
        status,
        price: 45000,
        leadTimeDays: 30,
    };
}

describe('UpdateProgramStatusUseCase', () => {
    describe('유효한 상태 전이', () => {
        it.each([
            ['DRAFT', 'ACTIVE'],
            ['ACTIVE', 'INACTIVE'],
            ['INACTIVE', 'ACTIVE'],
        ] as const)('%s → %s 전이를 허용한다', async (from, to) => {
            const { repository, updateStatus } = createRepositoryMock(ownershipWith(from));
            const useCase = new UpdateProgramStatusUseCase(repository);

            const result = await useCase.execute(OWNER_ID, STORE_ID, PROGRAM_ID, { status: to });

            expect(updateStatus).toHaveBeenCalledWith(PROGRAM_ID, to);
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
            const { repository, updateStatus } = createRepositoryMock(ownershipWith(from));
            const useCase = new UpdateProgramStatusUseCase(repository);

            await expect(
                useCase.execute(OWNER_ID, STORE_ID, PROGRAM_ID, { status: to }),
            ).rejects.toMatchObject({
                errorCode: 'INVALID_STATUS_TRANSITION',
                status: HttpStatus.BAD_REQUEST,
            });
            expect(updateStatus).not.toHaveBeenCalled();
        });

        it.each(['DRAFT', 'ACTIVE', 'INACTIVE'] as const)(
            '동일 상태(%s)로의 변경은 INVALID_STATUS_TRANSITION 으로 차단한다',
            async (status) => {
                const { repository, updateStatus } = createRepositoryMock(ownershipWith(status));
                const useCase = new UpdateProgramStatusUseCase(repository);

                await expect(
                    useCase.execute(OWNER_ID, STORE_ID, PROGRAM_ID, { status }),
                ).rejects.toMatchObject({ errorCode: 'INVALID_STATUS_TRANSITION' });
                expect(updateStatus).not.toHaveBeenCalled();
            },
        );
    });

    describe('권한 및 존재 검증', () => {
        it('타 파트너 소유 클래스는 FORBIDDEN(403)으로 차단한다', async () => {
            const { repository, updateStatus } = createRepositoryMock(
                ownershipWith('DRAFT', 'user-other'),
            );
            const useCase = new UpdateProgramStatusUseCase(repository);

            await expect(
                useCase.execute(OWNER_ID, STORE_ID, PROGRAM_ID, { status: 'ACTIVE' }),
            ).rejects.toMatchObject({
                errorCode: 'FORBIDDEN',
                status: HttpStatus.FORBIDDEN,
            });
            expect(updateStatus).not.toHaveBeenCalled();
        });

        it('존재하지 않는 프로그램은 PROGRAM_NOT_FOUND(404)로 차단한다', async () => {
            const { repository, updateStatus } = createRepositoryMock(null);
            const useCase = new UpdateProgramStatusUseCase(repository);

            await expect(
                useCase.execute(OWNER_ID, STORE_ID, PROGRAM_ID, { status: 'ACTIVE' }),
            ).rejects.toMatchObject({
                errorCode: 'PROGRAM_NOT_FOUND',
                status: HttpStatus.NOT_FOUND,
            });
            expect(updateStatus).not.toHaveBeenCalled();
        });

        it('storeId 불일치는 PROGRAM_NOT_FOUND(404)로 차단한다', async () => {
            const { repository } = createRepositoryMock(ownershipWith('DRAFT'));
            const useCase = new UpdateProgramStatusUseCase(repository);

            await expect(
                useCase.execute(OWNER_ID, 'store-other', PROGRAM_ID, { status: 'ACTIVE' }),
            ).rejects.toMatchObject({
                errorCode: 'PROGRAM_NOT_FOUND',
                status: HttpStatus.NOT_FOUND,
            });
        });
    });
});
