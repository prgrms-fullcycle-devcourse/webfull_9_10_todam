'use client';

import { phoneSchema, slugSchema } from '@todam/shared';
import { useEffect, useState } from 'react';

import { StudioInfoFields } from '@/entities/studio';
import { reverseGeocodeRegion } from '@/shared/lib/kakaoGeocode';
import { getFileValidationIssues } from '@/shared/lib/imageFile';
import { useToast } from '@/shared/model';
import { useStudioRegistrationStore } from '../model/studio';
import { MAX_STORE_IMAGES } from '../model/types';
import { useGeocode, useSlugAvailability } from '../queries';

const isSlug = (v: string) => slugSchema.safeParse(v).success;
const isPhone = (v: string) => phoneSchema.safeParse(v).success;

export function StudioInfoStep() {
    const store = useStudioRegistrationStore((s) => s.form.store);
    const patchStudio = useStudioRegistrationStore((s) => s.patchStudio);
    const setStoreAddress = useStudioRegistrationStore((s) => s.setStoreAddress);
    const addImageFiles = useStudioRegistrationStore((s) => s.addImageFiles);
    const removeImage = useStudioRegistrationStore((s) => s.removeImage);
    const { push } = useToast();
    const geocodeMutation = useGeocode();
    const handleAddImages = (files: File[]) => {
        const remaining = MAX_STORE_IMAGES - store.images.length;
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

    // 공방 주소 선택 → Kakao 좌표변환 + 행정구역(지역검색 소스). 실패해도 주소는 유지.
    const handleResolveAddress = async ({ address }: { postalCode: string; address: string }) => {
        let latitude = 0;
        let longitude = 0;
        let region: { sido: string; sigungu: string; dong: string } | null = null;
        try {
            const coords = await geocodeMutation.mutateAsync(address);
            latitude = coords.latitude;
            longitude = coords.longitude;
            // 좌표 → 행정구역. 실패해도 주소·좌표는 유지(region 만 null).
            try {
                region = await reverseGeocodeRegion(coords);
            } catch {
                /* region 변환 실패 — 지역검색 누락 가능하나 등록은 진행 */
            }
        } catch {
            push({ message: '주소 좌표를 가져오지 못했어요. 위치 정보 없이 저장됩니다.' });
        }
        setStoreAddress(address, latitude, longitude, region);
    };

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
            onAddImages={handleAddImages}
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
            address={store.address}
            addressDetail={store.addressDetail}
            onResolveAddress={handleResolveAddress}
            onChangeAddressDetail={(v) => patchStudio({ addressDetail: v })}
        />
    );
}
