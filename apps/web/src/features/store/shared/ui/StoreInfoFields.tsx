'use client';

import { formatPhone } from '@todam/shared';
import { TextArea, TextInput } from '@todam/ui';

import { ImageUploadField } from '../../../../shared/ui';
import { MAX_STORE_IMAGES } from '../model';

// 이미지 그리드 항목 — 등록(string url)·수정(EditImage)에서 공통 표현으로 정규화해 전달.
export interface StoreImageItem {
    key: string; // React key
    src?: string; // <img> 렌더 시 사용
    label?: string; // src 없을 때 텍스트로 표기 (등록 mock)
    onRemove: () => void;
}

interface StoreInfoFieldsProps {
    // 이미지
    images: StoreImageItem[];
    onAddImages: (files: File[]) => void;
    addImageDisabled?: boolean;

    // 공방명
    name: string;
    onChangeName: (v: string) => void;
    nameError?: string;

    // slug (공방 URL)
    slug: string;
    onChangeSlug: (v: string) => void;
    slugHasError: boolean;
    slugHelper: string;

    // 전화번호
    phone: string;
    onChangePhone: (v: string) => void;
    phoneError?: string;

    // 소개글
    description: string;
    onChangeDescription: (v: string) => void;
    descriptionMaxLength: number;
}

// 공방 정보 입력 (등록·수정 공유, store 비종속). 표현 레이어만 공유하고
// 이미지 업로드/slug 중복확인 등 로직 차이는 props(값·핸들러·헬퍼)로 주입받는다.
export function StoreInfoFields({
    images,
    onAddImages,
    addImageDisabled,
    name,
    onChangeName,
    nameError,
    slug,
    onChangeSlug,
    slugHasError,
    slugHelper,
    phone,
    onChangePhone,
    phoneError,
    description,
    onChangeDescription,
    descriptionMaxLength,
}: StoreInfoFieldsProps) {
    return (
        <div className="flex flex-col gap-4">
            {/* 대표 이미지 */}
            <ImageUploadField
                label="대표 이미지"
                hint={`(최대 ${MAX_STORE_IMAGES}장)`}
                items={images}
                onAdd={onAddImages}
                max={MAX_STORE_IMAGES}
                multiple
                accept="image/jpeg,image/png"
                addDisabled={addImageDisabled}
            />

            <TextInput
                label="공방명"
                placeholder="수강생에게 보여질 공방 이름을 입력해 주세요"
                value={name}
                error={!!nameError}
                helperText={nameError}
                onChange={(e) => onChangeName(e.target.value)}
            />

            {/* 공방 URL: leadem.com/ 프리픽스 고정 */}
            <div className="flex w-full flex-col gap-2">
                <label className="px-[5px] text-sm font-semibold text-foreground-tertiary">
                    공방 URL
                </label>
                <div
                    className={[
                        'group flex h-12 w-full items-center rounded-xl border bg-surface px-4 transition-colors',
                        slugHasError
                            ? 'border-danger'
                            : 'border-border-subtle focus-within:border-primary',
                    ].join(' ')}
                >
                    <span className="shrink-0 text-base text-foreground-tertiary group-focus-within:text-primary">
                        leadem.com/
                    </span>
                    <input
                        value={slug}
                        placeholder="공방아이디"
                        onChange={(e) => onChangeSlug(e.target.value.toLowerCase())}
                        className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-foreground-tertiary focus:text-primary focus:placeholder:text-primary"
                    />
                </div>
                <p
                    className={[
                        'px-[5px] text-xs',
                        slugHasError ? 'text-danger' : 'text-foreground-tertiary',
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
                value={phone}
                error={!!phoneError}
                helperText={phoneError}
                onChange={(e) => onChangePhone(formatPhone(e.target.value))}
            />

            <TextArea
                label="공방 소개글"
                optional
                placeholder="공방의 분위기나 작가님의 철학을 소개해 주세요"
                showCount
                maxLength={descriptionMaxLength}
                value={description}
                onChange={(e) => onChangeDescription(e.target.value)}
            />
        </div>
    );
}
