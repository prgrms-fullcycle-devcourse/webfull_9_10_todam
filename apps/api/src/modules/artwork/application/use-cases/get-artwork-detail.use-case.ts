import { HttpStatus, Injectable } from '@nestjs/common';
import { ImageUploadStatus } from '@prisma/client';
import type { ArtworkDetailResult } from '@todam/shared';
import { ArtworkDetailErrorCode } from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import {
    artworkStageDisplayState,
    ARTWORK_STAGE_SEQUENCE,
} from '../../domain/artwork-stage-display.util';
import { ArtworkRepository } from '../../domain/repositories/artwork.repository';

@Injectable()
export class GetArtworkDetailUseCase {
    constructor(private readonly artworks: ArtworkRepository) {}

    async execute(currentUserId: string, artworkId: string): Promise<ArtworkDetailResult> {
        // 1. 조회
        const row = await this.artworks.findUserArtworkDetail(artworkId);

        if (!row) {
            throw new BusinessException(
                ArtworkDetailErrorCode.ARTWORK_NOT_FOUND,
                '작품을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 2. 본인 가드
        if (row.reservation.userId !== currentUserId) {
            throw new BusinessException(
                ArtworkDetailErrorCode.FORBIDDEN,
                '해당 작품에 대한 접근 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // 3. currentIndex = STAGE_SEQUENCE.indexOf(Artwork.status).
        //    RESERVED/CANCELED 는 시퀀스에 없으므로 -1 → 전부 upcoming.
        const currentIndex = ARTWORK_STAGE_SEQUENCE.indexOf(
            row.status as (typeof ARTWORK_STAGE_SEQUENCE)[number],
        );

        // 4. timeline 합성 — 고정 6단계
        const timeline = ARTWORK_STAGE_SEQUENCE.map((stage, stageIndex) => {
            const isCompleted = stageIndex < currentIndex;
            const isCurrent = stage === row.status;

            // 해당 stage 의 ArtworkLog 중 createdAt 최신 1건.
            const stageLogs = row.logs.filter((log) => log.toStatus === stage);
            const log =
                stageLogs.length > 0
                    ? stageLogs.reduce((latest, curr) =>
                          curr.createdAt > latest.createdAt ? curr : latest,
                      )
                    : null;

            // photos: UPLOADED 만, thumbnailUrl 폴백 처리
            const photos = (log?.photos ?? [])
                .filter((p) => p.status === ImageUploadStatus.UPLOADED)
                .map((p) => ({
                    thumbnailUrl: p.thumbnailUrl ?? p.imageUrl,
                    imageUrl: p.imageUrl,
                }));

            const entry: {
                stage: string;
                isCompleted: boolean;
                isCurrent?: boolean;
                displayState: ReturnType<typeof artworkStageDisplayState>;
                photos: typeof photos;
                completedAt?: string;
            } = {
                stage,
                isCompleted,
                displayState: artworkStageDisplayState(stage),
                photos,
            };

            // isCurrent: 현재 단계만 true 포함. 아니면 필드 미포함.
            if (isCurrent) {
                entry.isCurrent = true;
            }

            // completedAt: isCompleted && 로그 존재 시만 포함.
            if (isCompleted && log) {
                entry.completedAt = log.createdAt.toISOString();
            }

            return entry;
        });

        // 5. currentStage
        const currentStage = {
            status: row.status,
            displayState: artworkStageDisplayState(row.status),
        };

        // 6. artwork
        // Prisma ArtworkStatus 와 shared ArtworkStatus 는 string 값이 동일하나
        // TypeScript 타입 공간에서 별개 enum 이므로 최종 반환 시 assertion 처리.
        return {
            artwork: {
                id: row.id,
                estimatedCompletedAt: row.estimatedCompletedAt?.toISOString() ?? null,
                currentStage,
                timeline,
            },
        } as ArtworkDetailResult;
    }
}
