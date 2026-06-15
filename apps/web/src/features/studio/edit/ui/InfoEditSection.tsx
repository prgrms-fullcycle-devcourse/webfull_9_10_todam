'use client';

import { phoneSchema, slugSchema } from '@todam/shared';
import { useEffect, useState } from 'react';

import { StudioInfoFields } from '@/entities/studio';
import { geocodeAddress, reverseGeocodeRegion } from '@/shared/lib/kakaoGeocode';
import { getFileValidationIssues } from '@/shared/lib/imageFile';
import { useToast } from '@/shared/model';
import { useStudioEditStore } from '../model/studio';
import { MAX_STORE_IMAGES } from '../model/types';
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
    const setStoreAddress = useStudioEditStore((s) => s.setStoreAddress);
    const { push } = useToast();

    const handleAddImages = (files: File[]) => {
        const remaining =
            MAX_STORE_IMAGES - (form?.store.images.length ?? 0) - pendingImages.length;
        if (files.length > remaining) {
            push({ message: `대표 이미지는 최대 ${MAX_STORE_IMAGES}장까지 추가할 수 있어요.` });
        }
        const issues = getFileValidationIssues(files, {
            allowedTypes: ['image/jpeg', 'image/png'],
        });
        if (issues.oversized) {
            push({ message: '5MB를 초과한 이미지는 추가할 수 없어요. 최대 파일 용량은 5MB예요.' });
        } else if (issues.unsupported) {
            push({ message: 'JPG 또는 PNG 형식의 이미지만 추가할 수 있어요.' });
        }
        addImageFiles(files.slice(0, remaining));
    };

    // 주소 선택 → Kakao 좌표변환 + 행정구역. 실패 시 좌표 없이 유지(저장은 좌표 있을 때만 전송).
    const handleResolveAddress = async ({ address }: { postalCode: string; address: string }) => {
        try {
            const coords = await geocodeAddress(address);
            let region: { sido: string; sigungu: string; dong: string } | null = null;
            try {
                region = await reverseGeocodeRegion(coords);
            } catch {
                /* region 변환 실패 — 좌표는 유지, 지역검색 라벨만 누락 */
            }
            setStoreAddress(address, coords.latitude, coords.longitude, region);
        } catch {
            push({ message: '주소 좌표를 가져오지 못했어요. 다시 시도해 주세요.' });
        }
    };

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
            onAddImages={handleAddImages}
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
            address={store.address}
            addressDetail={store.addressDetail}
            onResolveAddress={handleResolveAddress}
            onChangeAddressDetail={(v) => patchStudio({ addressDetail: v })}
            description={store.description}
            onChangeDescription={(v) => patchStudio({ description: v })}
            descriptionMaxLength={1000}
        />
    );
}
