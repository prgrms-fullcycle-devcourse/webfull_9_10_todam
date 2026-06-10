'use client';

import { phoneSchema, slugSchema } from '@todam/shared';
import { useEffect, useState } from 'react';

import { StudioInfoFields } from '@/entities/studio';
import { useStudioRegistrationStore } from '../model/studio';
import { useSlugAvailability } from '../queries';

const isSlug = (v: string) => slugSchema.safeParse(v).success;
const isPhone = (v: string) => phoneSchema.safeParse(v).success;

export function StudioInfoStep() {
    const store = useStudioRegistrationStore((s) => s.form.store);
    const patchStudio = useStudioRegistrationStore((s) => s.patchStudio);
    const addImageFiles = useStudioRegistrationStore((s) => s.addImageFiles);
    const removeImage = useStudioRegistrationStore((s) => s.removeImage);

    // 공방 URL 실시간(debounce) 중복확인 → TanStack Query
    const [debouncedSlug, setDebouncedSlug] = useState(store.slug);
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSlug(store.slug), 500);
        return () => clearTimeout(t);
    }, [store.slug]);

    const slugQuery = useSlugAvailability(debouncedSlug, isSlug(debouncedSlug));
    const slugChecking = slugQuery.isFetching;

    // 조회 결과 → store 동기화 (단계 유효성 판단용)
    useEffect(() => {
        if (slugQuery.data && slugQuery.data.slug === store.slug) {
            patchStudio({ slugChecked: true, slugAvailable: slugQuery.data.available });
        }
    }, [slugQuery.data, store.slug, patchStudio]);

    const slugFormatError =
        store.slug.length > 0 && !isSlug(store.slug) ? '영문 소문자·숫자·- 4~40자' : undefined;
    const phoneError =
        store.phone.length > 0 && !isPhone(store.phone) ? '02-1234-5678 형식' : undefined;
    const slugHasError = !!slugFormatError || (store.slugChecked && !store.slugAvailable);
    const slugHelper = slugFormatError
        ? slugFormatError
        : slugChecking
          ? '확인 중...'
          : store.slugChecked
            ? store.slugAvailable
                ? '사용 가능한 URL입니다.'
                : '이미 사용 중인 URL입니다.'
            : '미입력 시 자동 생성됩니다.';

    return (
        <StudioInfoFields
            existingImages={[]}
            pendingImages={store.images}
            onAddImages={addImageFiles}
            onRemoveExisting={() => {}}
            onRemovePending={removeImage}
            name={store.name}
            onChangeName={(v) => patchStudio({ name: v })}
            slug={store.slug}
            onChangeSlug={(v) => patchStudio({ slug: v })}
            slugHasError={slugHasError}
            slugHelper={slugHelper}
            phone={store.phone}
            onChangePhone={(v) => patchStudio({ phone: v })}
            phoneError={phoneError}
            description={store.description}
            onChangeDescription={(v) => patchStudio({ description: v })}
            descriptionMaxLength={300}
        />
    );
}
