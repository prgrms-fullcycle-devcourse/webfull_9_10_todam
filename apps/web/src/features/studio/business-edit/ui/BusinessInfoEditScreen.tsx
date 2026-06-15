'use client';

import {
    businessNumberSchema,
    emailSchema,
    formatBusinessNumber,
    type PartnerStoreDetail,
} from '@todam/shared';
import { BottomBar, Button, TextInput } from '@todam/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ApiError } from '@/shared/api';
import { openPostcode } from '@/shared/lib/daumPostcode';
import { getFileValidationIssues } from '@/shared/lib/imageFile';
import { useEditableForm } from '@/shared/lib/useEditableForm';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useToast } from '@/shared/model';
import { ImageUploadField, type ImageUploadGridItem } from '@/shared/ui';
import {
    useBusinessEditStudioDetail,
    useRefreshOnboardingThenGo,
    useUpdateBusinessDocument,
    useUploadBusinessDocument,
} from '../queries';

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
    const detailQuery = useBusinessEditStudioDetail(storeId);
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

    if (!store.businessDocument) {
        return (
            <div className="flex flex-1 items-center justify-center py-20 text-sm text-foreground-tertiary">
                사업자 정보가 없어 수정할 수 없어요.
            </div>
        );
    }

    return <BusinessEditInner storeId={storeId} store={store} />;
}

function BusinessEditInner({ storeId, store }: { storeId: string; store: PartnerStoreDetail }) {
    const router = useRouter();
    const { push } = useToast();
    // 사업자 서류 미등록(null) 공방은 빈 값으로 prefill — 신규 입력.
    const doc = store.businessDocument;

    const baseline: BusinessForm = {
        businessNumber: doc ? formatBusinessNumber(doc.businessNumber) : '',
        businessName: doc?.businessName ?? '',
        ownerName: doc?.ownerName ?? '',
        businessAddress: doc?.businessAddress ?? '',
        email: doc?.email ?? '',
        // 서류 이미지 prefill 보류: 사업자서류 S3 객체 비공개(403) → raw URL 표시 불가.
        // TODO: 표시하려면 presigned GET 발급 필요(별도 작업). baseline=null → 재업로드만.
        documentUrl: null,
    };
    const { form, patch, isDirty } = useEditableForm(baseline);

    const mutation = useUpdateBusinessDocument(storeId);
    const uploadDoc = useUploadBusinessDocument();
    const refreshOnboarding = useRefreshOnboardingThenGo();
    const saving = mutation.isPending;

    // 업로드한 파일의 로컬 미리보기 URL. 이미지일 때만 썸네일(PDF 는 라벨 유지). (등록 BusinessStep 동일 패턴)
    const [docPreview, setDocPreview] = useState<{ src: string; name: string } | null>(null);

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
            if (!result) return; // 사용자가 선택 없이 닫음
            patch({ businessAddress: result.roadAddress });
        } catch {
            push({ message: '주소 검색을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.' });
        }
    };

    const handleAddDocument = async (files: File[]) => {
        const file = files[0];
        if (!file || uploadDoc.isPending) return;
        const issues = getFileValidationIssues([file], {
            allowedTypes: ['image/jpeg', 'image/png'],
        });
        if (issues.oversized) {
            push({ message: '5MB를 초과한 파일은 업로드할 수 없어요. 최대 파일 용량은 5MB예요.' });
            return;
        }
        if (issues.unsupported) {
            push({ message: 'JPG 또는 PNG 형식의 파일만 업로드할 수 있어요.' });
            return;
        }
        try {
            const { documentUrl } = await uploadDoc.mutateAsync(file);
            patch({ documentUrl });
            const isImage = file.type.startsWith('image/');
            setDocPreview({ src: isImage ? URL.createObjectURL(file) : '', name: file.name });
        } catch {
            push({ message: '사업자등록증 업로드에 실패했어요. 잠시 후 다시 시도해주세요.' });
        }
    };

    const handleRemoveDocument = () => {
        if (docPreview?.src) URL.revokeObjectURL(docPreview.src);
        setDocPreview(null);
        patch({ documentUrl: null });
    };

    // 이미지 파일이면 로컬 썸네일(src) 표시, PDF 등은 파일명 라벨 유지
    const documentItems: ImageUploadGridItem[] = form.documentUrl
        ? [
              {
                  key: form.documentUrl,
                  src: docPreview?.src || undefined,
                  label: docPreview?.src ? undefined : docPreview?.name,
                  alt: docPreview?.name,
                  onRemove: handleRemoveDocument,
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
                documentUrl: form.documentUrl,
            });
            push({ message: '사업자 정보가 수정되어 재심사를 요청했어요.' });

            await refreshOnboarding();
            router.push('/partner/studio');
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
                    onAdd={handleAddDocument}
                    max={1}
                    multiple={false}
                    accept="image/jpeg,image/png"
                    addDisabled={uploadDoc.isPending}
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
