'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CreateProgramRequest } from '@todam/shared';

import { uploadToPresignedUrl } from '@/shared/api';

import { confirmProgramImage, createProgram, createProgramImage } from './api';
import type { ProgramRegistrationForm } from './model/types';

// 폼 → POST /programs body 매핑 (plan API Contract 스냅샷 바인딩).
function toCreateProgramBody(form: ProgramRegistrationForm): CreateProgramRequest {
    return {
        title: form.title.trim(),
        description: form.description.trim() || null,
        price: form.price ?? 0,
        durationMinutes: form.durationMinutes ?? 0,
        difficulty: form.difficulty,
        childFriendly: form.childFriendly,
        leadTimeDays: form.leadTimeDays ?? 0,
        deliverable: form.deliverable,
    };
}

// 클래스 오케스트레이션.
// ① POST /programs → programId 획득(ACTIVE 직접 생성). 실패 시 throw = 진짜 등록 실패.
// ②③④ 이미지 presigned→S3 PUT→confirm. **프로그램은 이미 등록됐으므로 이미지 실패는 부분실패로 처리**
//   (throw 하지 않음). 실패한 PENDING 이미지는 고아로 남아 cleanup 대상. DELETE program EP가 scope 밖이라 롤백 불가.
// 반환: { programId, imageFailed }.
export function useSubmitProgramRegistration(storeId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (
            form: ProgramRegistrationForm,
        ): Promise<{ programId: string; imageFailed: boolean }> => {
            // ① 클래스 등록 (실패하면 throw → 등록 실패로 처리)
            const { program } = await createProgram(storeId, toCreateProgramBody(form));
            const programId = program.id;

            // ②③④ 대표 이미지 — 실패해도 프로그램 등록은 유효. 부분실패만 표시.
            let imageFailed = false;
            for (const image of form.images) {
                try {
                    const { programImageId, uploadUrl } = await createProgramImage(
                        storeId,
                        programId,
                        {
                            fileName: image.file.name,
                            fileType: image.file.type,
                            isThumbnail: image.isThumbnail,
                        },
                    );
                    await uploadToPresignedUrl(uploadUrl, image.file);
                    await confirmProgramImage(storeId, programId, programImageId);
                } catch {
                    imageFailed = true;
                }
            }

            return { programId, imageFailed };
        },
        onSuccess: () => {
            // 클래스 관리 목록 캐시 무효화 → 복귀 시 신규 카드 반영. (list/queries KEY 와 동일 prefix)
            queryClient.invalidateQueries({
                queryKey: ['partner', 'studios', storeId, 'programs'],
            });
        },
    });
}
