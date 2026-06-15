'use client';

import { formatPhone } from '@todam/shared';
import { TextArea, TextInput } from '@todam/ui';

import type { ExistingImage, PendingImage } from '@/shared/model';
import { AddressSearchInput, PendingImageField } from '@/shared/ui';
import { MAX_STORE_IMAGES } from '../model';

interface StudioInfoFieldsProps {
    // 이미지 (전역 펜딩 필드 직접 소비) — 등록은 existing 없음, 수정은 서버 이미지 existing.
    existingImages: ExistingImage[];
    pendingImages: PendingImage[];
    onAddImages: (files: File[]) => void;
    onRemoveExisting: (id: string) => void;
    onRemovePending: (index: number) => void;

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

    // 공방 운영 주소 (고객 노출·위치기반). 등록 단계에서만 주입 — 미전달 시 미노출.
    address?: string;
    addressDetail?: string;
    addressError?: string;
    onResolveAddress?: (next: { postalCode: string; address: string }) => void;
    onChangeAddressDetail?: (v: string) => void;
}

// 공방 정보 입력 (등록·수정 공유, store 비종속). 표현 레이어만 공유하고
// 이미지 업로드/slug 중복확인 등 로직 차이는 props(값·핸들러·헬퍼)로 주입받는다.
export function StudioInfoFields({
    existingImages,
    pendingImages,
    onAddImages,
    onRemoveExisting,
    onRemovePending,
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
    address,
    addressDetail,
    addressError,
    onResolveAddress,
    onChangeAddressDetail,
}: StudioInfoFieldsProps) {
    return (
        <div className="flex flex-col gap-4">
            {/* 대표 이미지 — 전역 펜딩 필드 */}
            <PendingImageField
                label="대표 이미지"
                hint={`(최대 ${MAX_STORE_IMAGES}장)`}
                existingImages={existingImages}
                pendingImages={pendingImages}
                onAdd={onAddImages}
                onRemoveExisting={onRemoveExisting}
                onRemovePending={onRemovePending}
                max={MAX_STORE_IMAGES}
                multiple
                accept="image/jpeg,image/png"
                alt="대표 이미지"
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

            {/* 공방 운영 주소 — 등록 단계에서만 주입(onResolveAddress 존재 시 노출) */}
            {onResolveAddress && (
                <div className="flex flex-col gap-2">
                    <AddressSearchInput
                        label="공방 주소"
                        value={address ?? ''}
                        error={!!addressError}
                        helperText={addressError}
                        onResolved={onResolveAddress}
                    />
                    {/* 상세주소 — 핸들러 주입 시에만 노출(등록). 수정은 미사용(store 미보유 필드). */}
                    {onChangeAddressDetail && (
                        <TextInput
                            placeholder={
                                address
                                    ? '상세주소를 입력해 주세요'
                                    : '주소 검색 후 입력할 수 있어요'
                            }
                            value={addressDetail ?? ''}
                            disabled={!address}
                            onChange={(e) => onChangeAddressDetail(e.target.value)}
                        />
                    )}
                </div>
            )}

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
