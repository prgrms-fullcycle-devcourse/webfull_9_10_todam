'use client';

import { phoneSchema, slugSchema } from '@todam/shared';

import { StoreInfoFields } from '@/features/store/shared/ui';
import { useStoreEditStore } from '../model/store';

const isSlug = (v: string) => slugSchema.safeParse(v).success;
const isPhone = (v: string) => phoneSchema.safeParse(v).success;

export function InfoEditSection() {
    const form = useStoreEditStore((s) => s.form);
    const slugDuplicated = useStoreEditStore((s) => s.slugDuplicated);
    const pendingImages = useStoreEditStore((s) => s.pendingImages);
    const patchStore = useStoreEditStore((s) => s.patchStore);
    const addImageFiles = useStoreEditStore((s) => s.addImageFiles);
    const removeExistingImage = useStoreEditStore((s) => s.removeExistingImage);
    const removePendingImage = useStoreEditStore((s) => s.removePendingImage);

    if (!form) return null;
    const store = form.store;

    const nameError =
        store.name.length > 0 && (store.name.trim().length < 2 || store.name.trim().length > 40)
            ? '2~40자로 입력해 주세요'
            : undefined;
    const slugFormatError =
        store.slug.length > 0 && !isSlug(store.slug) ? '영문 소문자·숫자·-·_ 3~30자' : undefined;
    const phoneError =
        store.phone.length > 0 && !isPhone(store.phone) ? '02-1234-5678 형식' : undefined;
    const slugHasError = !!slugFormatError || slugDuplicated;
    const slugHelper = slugFormatError
        ? slugFormatError
        : slugDuplicated
          ? '이미 사용 중인 URL입니다.'
          : '공방 주소로 사용돼요.';

    // 서버 이미지(existing) → {id, src}. 삭제·업로드는 저장 시 일괄 처리.
    const existingImages = store.images.map((img) => ({ id: img.id, src: img.imageUrl }));

    return (
        <StoreInfoFields
            existingImages={existingImages}
            pendingImages={pendingImages}
            onAddImages={addImageFiles}
            onRemoveExisting={removeExistingImage}
            onRemovePending={removePendingImage}
            name={store.name}
            onChangeName={(v) => patchStore({ name: v })}
            nameError={nameError}
            slug={store.slug}
            onChangeSlug={(v) => patchStore({ slug: v })}
            slugHasError={slugHasError}
            slugHelper={slugHelper}
            phone={store.phone}
            onChangePhone={(v) => patchStore({ phone: v })}
            phoneError={phoneError}
            description={store.description}
            onChangeDescription={(v) => patchStore({ description: v })}
            descriptionMaxLength={1000}
        />
    );
}
