'use client';

import { phoneSchema, slugSchema } from '@todam/shared';
import { useEffect, useRef, useState } from 'react';

import { StoreInfoFields, type StoreImageItem } from '../../shared/ui';
import { useStoreRegistrationStore } from '../model/store';
import { useSlugAvailability } from '../queries';

const isSlug = (v: string) => slugSchema.safeParse(v).success;
const isPhone = (v: string) => phoneSchema.safeParse(v).success;

export function StoreInfoStep() {
    const store = useStoreRegistrationStore((s) => s.form.store);
    const patchStore = useStoreRegistrationStore((s) => s.patchStore);
    const addImage = useStoreRegistrationStore((s) => s.addImage);
    const removeImage = useStoreRegistrationStore((s) => s.removeImage);

    const imgRef = useRef<HTMLInputElement>(null);

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
            patchStore({ slugChecked: true, slugAvailable: slugQuery.data.available });
        }
    }, [slugQuery.data, store.slug, patchStore]);

    const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        // TODO(presigned 후행): 실제 업로드 후 key 저장. 현재 mock url.
        files.forEach((f) => addImage(`mock://store/${f.name}`));
        e.target.value = '';
    };

    const slugFormatError =
        store.slug.length > 0 && !isSlug(store.slug) ? '영문 소문자·숫자·-·_ 3~30자' : undefined;
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

    const images: StoreImageItem[] = store.images.map((url, i) => ({
        key: `${url}-${i}`,
        label: url.replace('mock://store/', ''),
        onRemove: () => removeImage(i),
    }));

    return (
        <StoreInfoFields
            images={images}
            fileInputRef={imgRef}
            onPickFiles={handleImages}
            name={store.name}
            onChangeName={(v) => patchStore({ name: v })}
            slug={store.slug}
            onChangeSlug={(v) => patchStore({ slug: v })}
            slugHasError={slugHasError}
            slugHelper={slugHelper}
            phone={store.phone}
            onChangePhone={(v) => patchStore({ phone: v })}
            phoneError={phoneError}
            description={store.description}
            onChangeDescription={(v) => patchStore({ description: v })}
            descriptionMaxLength={300}
        />
    );
}
