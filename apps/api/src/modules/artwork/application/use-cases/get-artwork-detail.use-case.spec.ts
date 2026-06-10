/// <reference types="jest" />
import { HttpStatus } from '@nestjs/common';
import { ArtworkStatus, ImageUploadStatus } from '@prisma/client';
import { ArtworkDetailErrorCode } from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type { UserArtworkDetailRow } from '../../domain/repositories/artwork.repository';
import { ArtworkRepository } from '../../domain/repositories/artwork.repository';
import { GetArtworkDetailUseCase } from './get-artwork-detail.use-case';

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

type PhotoRow = UserArtworkDetailRow['logs'][number]['photos'][number];
type LogRow = UserArtworkDetailRow['logs'][number];

function makePhoto(overrides: Partial<PhotoRow> = {}): PhotoRow {
    return {
        id: 'photo-uuid-001',
        imageUrl: 'https://cdn.todam.app/photo.jpg',
        status: ImageUploadStatus.UPLOADED,
        ...overrides,
    };
}

function makeLog(toStatus: ArtworkStatus, createdAt: Date, photos: PhotoRow[] = []): LogRow {
    return {
        id: `log-${toStatus}`,
        toStatus,
        createdAt,
        photos,
    };
}

function makeRow(overrides: Partial<UserArtworkDetailRow> = {}): UserArtworkDetailRow {
    return {
        id: 'artwork-uuid-001',
        status: ArtworkStatus.DRYING,
        estimatedCompletedAt: new Date('2026-07-01T00:00:00.000Z'),
        reservation: { userId: 'user-uuid-001' },
        logs: [],
        ...overrides,
    };
}

class MockRepository extends ArtworkRepository {
    constructor(private readonly row: UserArtworkDetailRow | null) {
        super();
    }
    override async findUserArtworkDetail(): Promise<UserArtworkDetailRow | null> {
        return this.row;
    }
    // 미사용 파트너 메서드 stub
    override async list(): Promise<never> {
        throw new Error('not impl');
    }
    override async count(): Promise<never> {
        throw new Error('not impl');
    }
    override async detail(): Promise<never> {
        throw new Error('not impl');
    }
    override async updateStatus(): Promise<never> {
        throw new Error('not impl');
    }
    override async bulkUpdateStatus(): Promise<never> {
        throw new Error('not impl');
    }
    override async createPhotos(): Promise<never> {
        throw new Error('not impl');
    }
    override async confirmPhoto(): Promise<never> {
        throw new Error('not impl');
    }
    override async deletePhoto(): Promise<never> {
        throw new Error('not impl');
    }
    override async updateDeliveryInfo(): Promise<never> {
        throw new Error('not impl');
    }
    override async updateDelivery(): Promise<never> {
        throw new Error('not impl');
    }
}

function makeUseCase(row: UserArtworkDetailRow | null) {
    return new GetArtworkDetailUseCase(new MockRepository(row));
}

const CURRENT_USER_ID = 'user-uuid-001';
const ARTWORK_ID = 'artwork-uuid-001';

// ─── 테스트 ────────────────────────────────────────────────────────────────────

describe('GetArtworkDetailUseCase', () => {
    // ── 404 ──
    describe('404 - 존재하지 않는 작품', () => {
        it('findUserArtworkDetail이 null이면 ARTWORK_NOT_FOUND(404)를 던진다', async () => {
            const uc = makeUseCase(null);
            await expect(uc.execute(CURRENT_USER_ID, ARTWORK_ID)).rejects.toMatchObject({
                errorCode: ArtworkDetailErrorCode.ARTWORK_NOT_FOUND,
                status: HttpStatus.NOT_FOUND,
            } as Partial<BusinessException>);
        });
    });

    // ── 403 ──
    describe('403 - 본인 가드', () => {
        it('userId 불일치이면 FORBIDDEN(403)을 던진다', async () => {
            const uc = makeUseCase(makeRow({ reservation: { userId: 'other-user-uuid' } }));
            await expect(uc.execute(CURRENT_USER_ID, ARTWORK_ID)).rejects.toMatchObject({
                errorCode: ArtworkDetailErrorCode.FORBIDDEN,
                status: HttpStatus.FORBIDDEN,
            } as Partial<BusinessException>);
        });

        it('userId=null이면 403을 던진다', async () => {
            const uc = makeUseCase(makeRow({ reservation: { userId: null } }));
            await expect(uc.execute(CURRENT_USER_ID, ARTWORK_ID)).rejects.toMatchObject({
                errorCode: ArtworkDetailErrorCode.FORBIDDEN,
                status: HttpStatus.FORBIDDEN,
            } as Partial<BusinessException>);
        });
    });

    // ── timeline 6단계 고정 구조 ──
    describe('timeline 합성', () => {
        it('timeline은 항상 6단계(VISITED→DRYING→BISQUE_FIRING→GLAZING→GLAZE_FIRING→COMPLETED)', async () => {
            const uc = makeUseCase(makeRow());
            const result = await uc.execute(CURRENT_USER_ID, ARTWORK_ID);
            const stages = result.artwork.timeline.map((e) => e.stage);
            expect(stages).toEqual([
                ArtworkStatus.VISITED,
                ArtworkStatus.DRYING,
                ArtworkStatus.BISQUE_FIRING,
                ArtworkStatus.GLAZING,
                ArtworkStatus.GLAZE_FIRING,
                ArtworkStatus.COMPLETED,
            ]);
        });

        it('현재 단계(DRYING) 이전 VISITED → isCompleted=true', async () => {
            const uc = makeUseCase(makeRow({ status: ArtworkStatus.DRYING }));
            const result = await uc.execute(CURRENT_USER_ID, ARTWORK_ID);
            const visited = result.artwork.timeline[0]!;
            expect(visited.stage).toBe(ArtworkStatus.VISITED);
            expect(visited.isCompleted).toBe(true);
        });

        it('현재 단계(DRYING) → isCompleted=false, isCurrent=true', async () => {
            const uc = makeUseCase(makeRow({ status: ArtworkStatus.DRYING }));
            const result = await uc.execute(CURRENT_USER_ID, ARTWORK_ID);
            const drying = result.artwork.timeline[1]!;
            expect(drying.stage).toBe(ArtworkStatus.DRYING);
            expect(drying.isCompleted).toBe(false);
            expect(drying.isCurrent).toBe(true);
        });

        it('미완료 단계(BISQUE_FIRING 이후) → isCompleted=false, isCurrent 없음', async () => {
            const uc = makeUseCase(makeRow({ status: ArtworkStatus.DRYING }));
            const result = await uc.execute(CURRENT_USER_ID, ARTWORK_ID);
            const bisque = result.artwork.timeline[2]!;
            expect(bisque.isCompleted).toBe(false);
            expect(bisque.isCurrent).toBeUndefined();
        });
    });

    // ── isCurrent 필드 부재 규칙 ──
    describe('isCurrent 필드 미포함 규칙', () => {
        it('완료 단계(isCompleted=true)는 isCurrent 필드 미포함', async () => {
            const uc = makeUseCase(
                makeRow({
                    status: ArtworkStatus.GLAZING,
                    logs: [
                        makeLog(ArtworkStatus.VISITED, new Date('2026-04-03T00:00:00Z')),
                        makeLog(ArtworkStatus.DRYING, new Date('2026-04-05T00:00:00Z')),
                        makeLog(ArtworkStatus.BISQUE_FIRING, new Date('2026-04-10T00:00:00Z')),
                    ],
                }),
            );
            const result = await uc.execute(CURRENT_USER_ID, ARTWORK_ID);
            const visited = result.artwork.timeline[0]!;
            expect(visited.isCompleted).toBe(true);
            expect(visited.isCurrent).toBeUndefined();
        });
    });

    // ── completedAt 규칙 ──
    describe('completedAt', () => {
        it('완료 단계 + 로그 존재 → completedAt = log.createdAt ISO', async () => {
            const logDate = new Date('2026-04-03T12:30:00.000Z');
            const uc = makeUseCase(
                makeRow({
                    status: ArtworkStatus.DRYING,
                    logs: [makeLog(ArtworkStatus.VISITED, logDate)],
                }),
            );
            const result = await uc.execute(CURRENT_USER_ID, ARTWORK_ID);
            const visited = result.artwork.timeline[0]!;
            expect(visited.completedAt).toBe(logDate.toISOString());
        });

        it('완료 단계이지만 로그 없으면 completedAt 미포함', async () => {
            const uc = makeUseCase(makeRow({ status: ArtworkStatus.DRYING, logs: [] }));
            const result = await uc.execute(CURRENT_USER_ID, ARTWORK_ID);
            const visited = result.artwork.timeline[0]!;
            expect(visited.completedAt).toBeUndefined();
        });

        it('현재/미완료 단계는 completedAt 미포함', async () => {
            const uc = makeUseCase(
                makeRow({
                    status: ArtworkStatus.DRYING,
                    logs: [makeLog(ArtworkStatus.DRYING, new Date())],
                }),
            );
            const result = await uc.execute(CURRENT_USER_ID, ARTWORK_ID);
            const drying = result.artwork.timeline[1]!; // DRYING = 현재
            expect(drying.completedAt).toBeUndefined();
        });
    });

    // ── photos UPLOADED 필터 ──
    describe('photos UPLOADED 필터', () => {
        it('UPLOADED 사진만 반환한다', async () => {
            const uc = makeUseCase(
                makeRow({
                    status: ArtworkStatus.DRYING,
                    logs: [
                        makeLog(ArtworkStatus.DRYING, new Date(), [
                            makePhoto({ id: 'p1', status: ImageUploadStatus.UPLOADED }),
                            makePhoto({ id: 'p2', status: ImageUploadStatus.PENDING }),
                            makePhoto({ id: 'p3', status: ImageUploadStatus.FAILED }),
                        ]),
                    ],
                }),
            );
            const result = await uc.execute(CURRENT_USER_ID, ARTWORK_ID);
            const drying = result.artwork.timeline[1]!;
            expect(drying.photos).toHaveLength(1);
            expect(drying.photos[0]!.imageUrl).toBe('https://cdn.todam.app/photo.jpg');
        });

        it('로그 없으면 photos=[]', async () => {
            const uc = makeUseCase(makeRow({ status: ArtworkStatus.DRYING, logs: [] }));
            const result = await uc.execute(CURRENT_USER_ID, ARTWORK_ID);
            // 미완료 단계도 photos=[]
            const bisque = result.artwork.timeline[2]!;
            expect(bisque.photos).toEqual([]);
        });
    });

    // ── 사진 노출 ──
    describe('사진 노출', () => {
        it('UPLOADED 사진의 imageUrl을 그대로 노출한다', async () => {
            const uc = makeUseCase(
                makeRow({
                    status: ArtworkStatus.DRYING,
                    logs: [
                        makeLog(ArtworkStatus.DRYING, new Date(), [
                            makePhoto({
                                imageUrl: 'https://cdn.todam.app/full.jpg',
                                status: ImageUploadStatus.UPLOADED,
                            }),
                        ]),
                    ],
                }),
            );
            const result = await uc.execute(CURRENT_USER_ID, ARTWORK_ID);
            const drying = result.artwork.timeline[1]!;
            expect(drying.photos[0]!.imageUrl).toBe('https://cdn.todam.app/full.jpg');
        });
    });

    // ── displayState 매핑 ──
    describe('displayState 매핑', () => {
        it.each([
            [ArtworkStatus.VISITED, '흙', '체험이 완료되었어요.', null],
            [ArtworkStatus.DRYING, '제작 중', '작품이 단단해지도록 정성껏 말리고 있어요.', '건조'],
            [
                ArtworkStatus.BISQUE_FIRING,
                '제작 중',
                '가마 속에서 첫 번째로 구워지는 중이에요.',
                '초벌',
            ],
            [
                ArtworkStatus.GLAZING,
                '제작 중',
                '매끄러운 빛깔을 내기 위해 예쁘게 옷을 입혔어요.',
                '유약',
            ],
            [
                ArtworkStatus.GLAZE_FIRING,
                '제작 중',
                '가장 뜨거운 가마를 견디며 더 튼튼해지고 있어요.',
                '재벌',
            ],
            [ArtworkStatus.COMPLETED, '완성', '작품이 완성되었어요.', null],
        ])(
            'stage=%s → label=%s, description=%s, subLabel=%s',
            async (status, label, description, subLabel) => {
                const uc = makeUseCase(makeRow({ status: status as ArtworkStatus }));
                const result = await uc.execute(CURRENT_USER_ID, ARTWORK_ID);
                // currentStage.displayState
                expect(result.artwork.currentStage.displayState.label).toBe(label);
                expect(result.artwork.currentStage.displayState.description).toBe(description);
                expect(result.artwork.currentStage.displayState.subLabel).toBe(subLabel);
            },
        );

        it('timeline 각 단계의 displayState도 stage에 맞게 매핑된다', async () => {
            const uc = makeUseCase(makeRow({ status: ArtworkStatus.DRYING }));
            const result = await uc.execute(CURRENT_USER_ID, ARTWORK_ID);
            const visited = result.artwork.timeline[0]!;
            expect(visited.displayState.label).toBe('흙');
            const drying = result.artwork.timeline[1]!;
            expect(drying.displayState.subLabel).toBe('건조');
        });
    });

    // ── D-EDGE: RESERVED/CANCELED currentStage ──
    describe('D-EDGE: RESERVED/CANCELED currentStage', () => {
        it('status=RESERVED → currentIndex=-1, 전부 upcoming, isCurrent 없음', async () => {
            const uc = makeUseCase(makeRow({ status: ArtworkStatus.RESERVED }));
            const result = await uc.execute(CURRENT_USER_ID, ARTWORK_ID);
            const allNotCompleted = result.artwork.timeline.every((e) => !e.isCompleted);
            const allNoCurrent = result.artwork.timeline.every((e) => e.isCurrent === undefined);
            expect(allNotCompleted).toBe(true);
            expect(allNoCurrent).toBe(true);
            expect(result.artwork.currentStage.status).toBe(ArtworkStatus.RESERVED);
            expect(result.artwork.currentStage.displayState.label).toBe('예약 완료');
        });

        it('status=CANCELED → 전부 upcoming, isCurrent 없음', async () => {
            const uc = makeUseCase(makeRow({ status: ArtworkStatus.CANCELED }));
            const result = await uc.execute(CURRENT_USER_ID, ARTWORK_ID);
            const allNoCurrent = result.artwork.timeline.every((e) => e.isCurrent === undefined);
            expect(allNoCurrent).toBe(true);
            expect(result.artwork.currentStage.displayState.label).toBe('제작 취소');
        });
    });

    // ── estimatedCompletedAt ──
    describe('estimatedCompletedAt', () => {
        it('estimatedCompletedAt 있으면 ISO 문자열', async () => {
            const date = new Date('2026-07-01T00:00:00.000Z');
            const uc = makeUseCase(makeRow({ estimatedCompletedAt: date }));
            const result = await uc.execute(CURRENT_USER_ID, ARTWORK_ID);
            expect(result.artwork.estimatedCompletedAt).toBe(date.toISOString());
        });

        it('estimatedCompletedAt=null이면 null 반환', async () => {
            const uc = makeUseCase(makeRow({ estimatedCompletedAt: null }));
            const result = await uc.execute(CURRENT_USER_ID, ARTWORK_ID);
            expect(result.artwork.estimatedCompletedAt).toBeNull();
        });
    });

    // ── Figma 정본 시나리오: GLAZING 현재, VISITED/DRYING/BISQUE_FIRING 완료 ──
    describe('Figma 정본 시나리오 (GLAZING 현재)', () => {
        it('GLAZING 현재: 3완료 + 1현재 + 2미완료 구조', async () => {
            const uc = makeUseCase(
                makeRow({
                    status: ArtworkStatus.GLAZING,
                    logs: [
                        makeLog(ArtworkStatus.VISITED, new Date('2026-04-03T12:30:00Z')),
                        makeLog(ArtworkStatus.DRYING, new Date('2026-04-05T15:00:00Z'), [
                            makePhoto({ id: 'p1', status: ImageUploadStatus.UPLOADED }),
                        ]),
                        makeLog(ArtworkStatus.BISQUE_FIRING, new Date('2026-04-20T11:00:00Z'), [
                            makePhoto({ id: 'p2', status: ImageUploadStatus.UPLOADED }),
                            makePhoto({ id: 'p3', status: ImageUploadStatus.UPLOADED }),
                        ]),
                        makeLog(ArtworkStatus.GLAZING, new Date('2026-05-01T09:00:00Z'), [
                            makePhoto({ id: 'p4', status: ImageUploadStatus.UPLOADED }),
                            makePhoto({ id: 'p5', status: ImageUploadStatus.UPLOADED }),
                            makePhoto({ id: 'p6', status: ImageUploadStatus.UPLOADED }),
                        ]),
                    ],
                }),
            );
            const result = await uc.execute(CURRENT_USER_ID, ARTWORK_ID);
            const t = result.artwork.timeline;

            // VISITED - 완료
            expect(t[0]!.isCompleted).toBe(true);
            expect(t[0]!.completedAt).toBe('2026-04-03T12:30:00.000Z');
            expect(t[0]!.photos).toHaveLength(0);

            // DRYING - 완료
            expect(t[1]!.isCompleted).toBe(true);
            expect(t[1]!.completedAt).toBe('2026-04-05T15:00:00.000Z');
            expect(t[1]!.photos).toHaveLength(1);

            // BISQUE_FIRING - 완료
            expect(t[2]!.isCompleted).toBe(true);
            expect(t[2]!.completedAt).toBe('2026-04-20T11:00:00.000Z');
            expect(t[2]!.photos).toHaveLength(2);

            // GLAZING - 현재
            expect(t[3]!.isCompleted).toBe(false);
            expect(t[3]!.isCurrent).toBe(true);
            expect(t[3]!.completedAt).toBeUndefined();
            expect(t[3]!.photos).toHaveLength(3);

            // GLAZE_FIRING - 미완료
            expect(t[4]!.isCompleted).toBe(false);
            expect(t[4]!.isCurrent).toBeUndefined();
            expect(t[4]!.photos).toHaveLength(0);

            // COMPLETED - 미완료
            expect(t[5]!.isCompleted).toBe(false);
            expect(t[5]!.isCurrent).toBeUndefined();
        });
    });

    // ── COMPLETED 단계: 모두 완료 ──
    describe('status=COMPLETED: 전 단계 완료', () => {
        it('COMPLETED이면 VISITED~GLAZE_FIRING 전부 isCompleted=true, COMPLETED는 isCurrent=true', async () => {
            const now = new Date();
            const uc = makeUseCase(
                makeRow({
                    status: ArtworkStatus.COMPLETED,
                    logs: [
                        makeLog(ArtworkStatus.VISITED, now),
                        makeLog(ArtworkStatus.DRYING, now),
                        makeLog(ArtworkStatus.BISQUE_FIRING, now),
                        makeLog(ArtworkStatus.GLAZING, now),
                        makeLog(ArtworkStatus.GLAZE_FIRING, now),
                        makeLog(ArtworkStatus.COMPLETED, now),
                    ],
                }),
            );
            const result = await uc.execute(CURRENT_USER_ID, ARTWORK_ID);
            const t = result.artwork.timeline;
            // 0~4 완료
            for (let i = 0; i < 5; i++) {
                expect(t[i]!.isCompleted).toBe(true);
                expect(t[i]!.isCurrent).toBeUndefined();
            }
            // 5: COMPLETED = isCurrent
            expect(t[5]!.isCompleted).toBe(false);
            expect(t[5]!.isCurrent).toBe(true);
        });
    });
});
