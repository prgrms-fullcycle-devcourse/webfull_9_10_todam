'use client';

import { phoneSchema, slugSchema } from '@todam/shared';
import { useEffect, useState } from 'react';

import { StudioInfoFields } from '@/entities/studio';
import { useStudioEditStore } from '../model/studio';
import { useSlugAvailability } from '../queries';

const isSlug = (v: string) => slugSchema.safeParse(v).success;
const isPhone = (v: string) => phoneSchema.safeParse(v).success;

type InfoEditSectionProps = {
    storeId: string;
};

export function InfoEditSection({ storeId }: InfoEditSectionProps) {
    const form = useStudioEditStore((s) => s.form);
    const initial = useStudioEditStore((s) => s.initial);
    const slugDuplicated = useStudioEditStore((s) => s.slugDuplicated);
    const pendingImages = useStudioEditStore((s) => s.pendingImages);
    const patchStudio = useStudioEditStore((s) => s.patchStudio);
    const addImageFiles = useStudioEditStore((s) => s.addImageFiles);
    const removeExistingImage = useStudioEditStore((s) => s.removeExistingImage);
    const removePendingImage = useStudioEditStore((s) => s.removePendingImage);
    const setSlugDuplicated = useStudioEditStore((s) => s.setSlugDuplicated);

    const slug = form?.store.slug ?? '';
    const initialSlug = initial?.store.slug ?? '';

    // 공방 URL 실시간(debounce) 사전 중복확인 → TanStack Query
    const [debouncedSlug, setDebouncedSlug] = useState(slug);
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSlug(slug), 500);
        return () => clearTimeout(t);
    }, [slug]);

    // 형식 유효 + 변경된 slug 일 때만 조회
    const slugChanged = debouncedSlug !== initialSlug;
    const slugQuery = useSlugAvailability(
        storeId,
        debouncedSlug,
        isSlug(debouncedSlug) && slugChanged,
    );
    const slugChecking = slugQuery.isFetching;

    // 조회 결과 → 중복 상태 동기화 (저장 가능 여부·문구 판단용).
    useEffect(() => {
        if (slugQuery.data && slugQuery.data.slug === slug && slug !== initialSlug) {
            setSlugDuplicated(!slugQuery.data.available);
        }
    }, [slugQuery.data, slug, initialSlug, setSlugDuplicated]);

    if (!form) return null;
    const store = form.store;

    const nameError =
        store.name.length > 0 && (store.name.trim().length < 2 || store.name.trim().length > 40)
            ? '2~40자로 입력해 주세요'
            : undefined;
    const slugFormatError =
        store.slug.length > 0 && !isSlug(store.slug) ? '영문 소문자·숫자·- 4~40자' : undefined;
    const phoneError =
        store.phone.length > 0 && !isPhone(store.phone) ? '02-1234-5678 형식' : undefined;
    const slugHasError = !!slugFormatError || slugDuplicated;
    const slugHelper = slugFormatError
        ? slugFormatError
        : slugChecking
          ? '확인 중...'
          : slugDuplicated
            ? '이미 사용 중인 URL입니다.'
            : '공방 주소로 사용돼요.';

    // 서버 이미지(existing) → {id, src}. 삭제·업로드는 저장 시 일괄 처리.
    const existingImages = store.images.map((img) => ({ id: img.id, src: img.imageUrl }));

    return (
        <StudioInfoFields
            existingImages={existingImages}
            pendingImages={pendingImages}
            onAddImages={addImageFiles}
            onRemoveExisting={removeExistingImage}
            onRemovePending={removePendingImage}
            name={store.name}
            onChangeName={(v) => patchStudio({ name: v })}
            nameError={nameError}
            slug={store.slug}
            onChangeSlug={(v) => patchStudio({ slug: v })}
            slugHasError={slugHasError}
            slugHelper={slugHelper}
            phone={store.phone}
            onChangePhone={(v) => patchStudio({ phone: v })}
            phoneError={phoneError}
            description={store.description}
            onChangeDescription={(v) => patchStudio({ description: v })}
            descriptionMaxLength={1000}
        />
    );
}
