'use client';

import { formatPhone, phoneSchema, slugSchema } from '@todam/shared';
import { CameraIcon, CloseIcon, TextArea, TextInput } from '@todam/ui';
import { useEffect, useRef, useState } from 'react';

import { useStoreRegistrationStore } from '../model/store';
import { MAX_STORE_IMAGES } from '../model/types';
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
        <div className="flex flex-col gap-4">
            {/* 대표 이미지 (최대 5장) */}
            <div className="flex flex-col gap-2">
                <span className="px-[5px] text-sm font-semibold text-foreground-tertiary">
                    대표 이미지 (최대 {MAX_STORE_IMAGES}장)
                </span>
                <input
                    ref={imgRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    multiple
                    className="hidden"
                    onChange={handleImages}
                />
                <div className="grid grid-cols-2 gap-3">
                    {store.images.map((url, i) => (
                        <div
                            key={`${url}-${i}`}
                            className="relative flex aspect-[4/3] items-center justify-center rounded-2xl bg-muted text-xs text-foreground-tertiary"
                        >
                            <span className="truncate px-2">
                                {url.replace('mock://store/', '')}
                            </span>
                            <button
                                type="button"
                                onClick={() => removeImage(i)}
                                aria-label="이미지 삭제"
                                className="absolute -right-1 -top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-emphasis text-foreground-inverse"
                            >
                                <CloseIcon size={14} />
                            </button>
                        </div>
                    ))}
                    {store.images.length < MAX_STORE_IMAGES && (
                        <button
                            type="button"
                            onClick={() => imgRef.current?.click()}
                            className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border text-foreground-tertiary"
                        >
                            <CameraIcon size={24} />
                        </button>
                    )}
                </div>
            </div>

            <TextInput
                label="공방명"
                placeholder="수강생에게 보여질 공방 이름을 입력해 주세요"
                value={store.name}
                onChange={(e) => patchStore({ name: e.target.value })}
            />

            {/* 공방 URL: leadem.com/ 프리픽스 고정 */}
            <div className="flex w-full flex-col gap-2">
                <label className="px-[5px] text-sm font-semibold text-foreground-tertiary">
                    공방 URL (선택)
                </label>
                <div
                    className={[
                        'group flex h-12 w-full items-center rounded-xl border bg-surface px-4 transition-colors',
                        slugFormatError || (store.slugChecked && !store.slugAvailable)
                            ? 'border-danger'
                            : 'border-border-subtle focus-within:border-primary',
                    ].join(' ')}
                >
                    <span className="shrink-0 text-base text-foreground-tertiary group-focus-within:text-primary">
                        leadem.com/
                    </span>
                    <input
                        value={store.slug}
                        placeholder="공방아이디"
                        onChange={(e) => patchStore({ slug: e.target.value.toLowerCase() })}
                        className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-foreground-tertiary focus:text-primary focus:placeholder:text-primary"
                    />
                </div>
                <p
                    className={[
                        'px-[5px] text-xs',
                        slugFormatError || (store.slugChecked && !store.slugAvailable)
                            ? 'text-danger'
                            : 'text-foreground-tertiary',
                    ].join(' ')}
                >
                    {slugHelper}
                </p>
            </div>

            <TextInput
                label="전화번호"
                type="tel"
                inputMode="numeric"
                placeholder="수강생 연락을 받을 공방 번호를 입력해 주세요"
                value={store.phone}
                error={!!phoneError}
                helperText={phoneError}
                onChange={(e) => patchStore({ phone: formatPhone(e.target.value) })}
            />

            <TextArea
                label="공방 소개글 (선택)"
                placeholder="공방의 분위기나 작가님의 철학을 소개해 주세요"
                showCount
                maxLength={300}
                value={store.description}
                onChange={(e) => patchStore({ description: e.target.value })}
            />
        </div>
    );
}
