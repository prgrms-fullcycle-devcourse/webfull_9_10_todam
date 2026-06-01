'use client';

import { phoneSchema, slugSchema } from '@todam/shared';
import { useRef } from 'react';

import { useToast } from '../../../../shared/model';
import { StoreInfoFields, type StoreImageItem } from '../../shared/ui';
import { MAX_STORE_IMAGES } from '../../shared/model';
import { useStoreEditStore } from '../model/store';
import { useAddStoreImage, useDeleteStoreImage } from '../queries';

const isSlug = (v: string) => slugSchema.safeParse(v).success;
const isPhone = (v: string) => phoneSchema.safeParse(v).success;

export function InfoEditSection() {
    const form = useStoreEditStore((s) => s.form);
    const slugDuplicated = useStoreEditStore((s) => s.slugDuplicated);
    const patchStore = useStoreEditStore((s) => s.patchStore);
    const addImage = useStoreEditStore((s) => s.addImage);
    const removeImage = useStoreEditStore((s) => s.removeImage);
    const { push } = useToast();

    const storeId = form?.storeId ?? '';
    const addImageMutation = useAddStoreImage(storeId);
    const deleteImageMutation = useDeleteStoreImage(storeId);
    const imgRef = useRef<HTMLInputElement>(null);

    if (!form) return null;
    const store = form.store;

    const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = '';
        for (const file of files) {
            if (store.images.length >= MAX_STORE_IMAGES) {
                push({ message: `대표 이미지는 최대 ${MAX_STORE_IMAGES}장까지 등록할 수 있어요.` });
                break;
            }
            try {
                const isThumbnail = store.images.length === 0;
                const result = await addImageMutation.mutateAsync({ file, isThumbnail });
                addImage({ id: result.id, imageUrl: result.imageUrl, isThumbnail });
            } catch {
                push({ message: '이미지 업로드에 실패했어요.' });
            }
        }
    };

    const handleRemove = (id: string) => {
        removeImage(id);
        // X 클릭 시 DELETE 호출 (최종 반영은 PATCH images[] 기준)
        deleteImageMutation.mutate(id);
    };

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

    const images: StoreImageItem[] = store.images.map((img) => ({
        key: img.id,
        src: img.imageUrl,
        onRemove: () => handleRemove(img.id),
    }));

    return (
        <StoreInfoFields
            images={images}
            fileInputRef={imgRef}
            onPickFiles={handleImages}
            addImageDisabled={addImageMutation.isPending}
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
