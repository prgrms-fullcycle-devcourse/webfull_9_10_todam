'use client';

import {
    businessNumberSchema,
    emailSchema,
    formatBusinessNumber,
    type PartnerStoreDetail,
} from '@todam/shared';
import { BottomBar, Button, TextInput } from '@todam/ui';
import { useRouter } from 'next/navigation';

import { ApiError } from '../../../../shared/api';
import { openPostcode } from '../../../../shared/lib/daumPostcode';
import { useEditableForm } from '../../../../shared/lib/useEditableForm';
import { useHeaderOverride } from '../../../../shared/lib/useHeaderOverride';
import { useToast } from '../../../../shared/model';
import { ImageUploadField, type ImageUploadGridItem } from '../../../../shared/ui';
import { usePartnerStoreDetail } from '../../detail';
import { useUpdateBusinessDocument } from '../queries';

const isBizNumber = (v: string) => businessNumberSchema.safeParse(v).success;
const isEmail = (v: string) => emailSchema.safeParse(v).success;

type BusinessForm = {
    businessNumber: string;
    businessName: string;
    ownerName: string;
    businessAddress: string;
    email: string;
    documentUrl: string | null;
};

// 사업자 정보 수정(반려 재수정). 저장 시 재심사(REJECTED→PENDING) 후 공방 상세로 복귀.
export function BusinessInfoEditScreen({ storeId }: { storeId: string }) {
    const detailQuery = usePartnerStoreDetail(storeId);
    const store = detailQuery.data?.store;

    if (detailQuery.isLoading || !store) {
        return (
            <div className="flex flex-1 items-center justify-center py-20 text-sm text-foreground-tertiary">
                불러오는 중...
            </div>
        );
    }
    if (detailQuery.isError) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
                <p className="text-sm text-foreground-tertiary">사업자 정보를 불러오지 못했어요.</p>
                <Button variant="ghost" size="sm" onClick={() => detailQuery.refetch()}>
                    다시 시도
                </Button>
            </div>
        );
    }

    return <BusinessEditInner storeId={storeId} store={store} />;
}

function BusinessEditInner({ storeId, store }: { storeId: string; store: PartnerStoreDetail }) {
    const router = useRouter();
    const { push } = useToast();
    const doc = store.businessDocument;

    const baseline: BusinessForm = {
        businessNumber: doc.businessNumber,
        businessName: doc.businessName,
        ownerName: doc.ownerName,
        businessAddress: doc.businessAddress,
        email: doc.email,
        documentUrl: null,
    };
    const { form, patch, isDirty } = useEditableForm(baseline);

    const mutation = useUpdateBusinessDocument(storeId);
    const saving = mutation.isPending;

    // 전역 Header override: 타이틀 + 뒤로가기(상세 복귀). 우측 액션 없음.
    useHeaderOverride({
        title: '사업자 정보 수정',
        onBack: () => router.back(),
        hideRightAction: true,
        guardDirty: isDirty,
    });

    const numberError =
        form.businessNumber.length > 0 && !isBizNumber(form.businessNumber)
            ? '000-00-00000 형식'
            : undefined;
    const emailError =
        form.email.length > 0 && !isEmail(form.email) ? '이메일 형식이 아니에요' : undefined;

    const valid =
        isBizNumber(form.businessNumber) &&
        form.businessName.trim().length > 0 &&
        form.ownerName.trim().length > 0 &&
        form.businessAddress.trim().length > 0 &&
        isEmail(form.email);
    const canSave = isDirty && valid && !saving;

    const handleAddressSearch = async () => {
        try {
            const result = await openPostcode();
            patch({ businessAddress: result.roadAddress });
        } catch {
            push({ message: '주소 검색을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.' });
        }
    };

    const documentItems: ImageUploadGridItem[] = form.documentUrl
        ? [
              {
                  key: form.documentUrl,
                  label: form.documentUrl.replace('mock://uploads/', ''),
                  onRemove: () => patch({ documentUrl: null }),
              },
          ]
        : [];

    const handleSave = async () => {
        if (!canSave) return;
        try {
            await mutation.mutateAsync({
                businessNumber: form.businessNumber,
                businessName: form.businessName,
                ownerName: form.ownerName,
                businessAddress: form.businessAddress,
                email: form.email,
            });
            push({ message: '사업자 정보가 수정되어 재심사를 요청했어요.' });
            router.push(`/partner/stores/${storeId}`);
        } catch (err) {
            push({
                message: err instanceof ApiError ? err.message : '저장 중 오류가 발생했어요.',
            });
        }
    };

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-16 pt-2">
                <ImageUploadField
                    label="사업자 등록증"
                    items={documentItems}
                    onAdd={(files) => {
                        const file = files[0];
                        if (file) patch({ documentUrl: `mock://uploads/${file.name}` });
                    }}
                    max={1}
                    multiple={false}
                    accept="image/jpeg,image/png,application/pdf"
                />

                <TextInput
                    label="사업자 등록번호"
                    inputMode="numeric"
                    placeholder="000-00-00000"
                    value={form.businessNumber}
                    error={!!numberError}
                    helperText={numberError}
                    onChange={(e) =>
                        patch({ businessNumber: formatBusinessNumber(e.target.value) })
                    }
                />
                <TextInput
                    label="상호명"
                    placeholder="사업자등록증에 기재된 상호명을 입력해 주세요"
                    value={form.businessName}
                    onChange={(e) => patch({ businessName: e.target.value })}
                />
                <TextInput
                    label="대표자명"
                    placeholder="대표자 성명을 입력해 주세요"
                    value={form.ownerName}
                    onChange={(e) => patch({ ownerName: e.target.value })}
                />
                <TextInput
                    label="사업장 주소"
                    placeholder="도로명 또는 지번 주소를 검색해 주세요"
                    value={form.businessAddress}
                    readOnly
                    onClick={handleAddressSearch}
                    className="cursor-pointer"
                />
                <TextInput
                    label="이메일"
                    type="email"
                    placeholder="예) leadem@studio.com"
                    value={form.email}
                    error={!!emailError}
                    helperText={emailError}
                    onChange={(e) => patch({ email: e.target.value })}
                />
            </div>

            <BottomBar>
                <Button className="w-full" disabled={!canSave} onClick={handleSave}>
                    {saving ? '저장 중...' : '저장'}
                </Button>
            </BottomBar>
        </div>
    );
}
