'use client';

import { businessStartDateSchema, formatBusinessNumber } from '@todam/shared';
import { DescriptionBlock, TextInput } from '@todam/ui';
import { useState } from 'react';

import { useToast } from '@/shared/model';
import { getFileValidationIssues } from '@/shared/lib/imageFile';
import { ImageUploadField, type ImageUploadGridItem } from '@/shared/ui';
import { useStudioRegistrationStore } from '../model/studio';
import { useOcrBusinessDocument, useUploadBusinessDocument } from '../queries';
import type { StudioRegistrationForm } from '../model/types';

const isStartDate = (v: string) => businessStartDateSchema.safeParse(v).success;

export function BusinessStep() {
    const business = useStudioRegistrationStore((s) => s.form.business);
    const patchBusiness = useStudioRegistrationStore((s) => s.patchBusiness);
    const { push } = useToast();

    // 업로드한 파일의 로컬 미리보기 URL. 이미지일 때만 썸네일(PDF 는 라벨 유지).
    const [docPreview, setDocPreview] = useState<{ src: string; name: string } | null>(null);
    const uploadDoc = useUploadBusinessDocument();
    const ocr = useOcrBusinessDocument();

    // OCR 결과 → 폼 prefill. 추출 실패 시 기존 값 유지.
    const applyOcr = (r: Awaited<ReturnType<typeof ocr.mutateAsync>>): number => {
        const patch: Partial<StudioRegistrationForm['business']> = {};
        if (r.businessNumber) patch.businessNumber = formatBusinessNumber(r.businessNumber);
        if (r.ownerName) patch.ownerName = r.ownerName;
        if (r.businessName) patch.businessName = r.businessName;
        if (r.businessAddress) patch.businessAddress = r.businessAddress;
        if (r.startDate) patch.startDate = r.startDate;
        const count = Object.keys(patch).length;
        if (count > 0) patchBusiness(patch);
        return count;
    };

    const handleAddDocument = async (files: File[]) => {
        const file = files[0];
        if (!file || uploadDoc.isPending || ocr.isPending) return;
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
            patchBusiness({ documentUrl });
            const isImage = file.type.startsWith('image/');
            setDocPreview({ src: isImage ? URL.createObjectURL(file) : '', name: file.name });

            // 업로드 성공 직후 OCR 자동입력. 실패하면 직접 입력 유도
            try {
                const result = await ocr.mutateAsync(documentUrl);
                const extracted = applyOcr(result);
                push({
                    message:
                        extracted > 0
                            ? '사업자등록증 정보를 자동입력했어요. 확인 후 수정해 주세요.'
                            : '정보를 인식하지 못했어요. 직접 입력해 주세요.',
                });
            } catch {
                push({ message: '자동입력에 실패했어요. 정보를 직접 입력해 주세요.' });
            }
        } catch {
            push({ message: '사업자등록증 업로드에 실패했어요. 잠시 후 다시 시도해주세요.' });
        }
    };

    const handleRemoveDocument = () => {
        if (docPreview?.src) URL.revokeObjectURL(docPreview.src);
        setDocPreview(null);
        patchBusiness({ documentUrl: null });
    };

    const busy = uploadDoc.isPending || ocr.isPending;

    const startDateError =
        business.startDate.length > 0 && !isStartDate(business.startDate)
            ? 'YYYYMMDD 8자리로 입력해 주세요 (예: 20190315)'
            : undefined;

    // 이미지 파일이면 로컬 썸네일(src) 표시, PDF 등은 파일명 라벨 유지.
    const documentItems: ImageUploadGridItem[] = business.documentUrl
        ? [
              {
                  key: business.documentUrl,
                  src: docPreview?.src || undefined,
                  label: docPreview?.src ? undefined : docPreview?.name,
                  alt: docPreview?.name,
                  onRemove: handleRemoveDocument,
              },
          ]
        : [];

    return (
        <div className="flex flex-col gap-4">
            {/* 사업자 등록증 업로드 → 업로드 후 OCR 자동입력 */}
            <ImageUploadField
                label="사업자 등록증"
                items={documentItems}
                onAdd={handleAddDocument}
                max={1}
                multiple={false}
                accept="image/jpeg,image/png"
                addDisabled={busy}
            />
            {busy && (
                <p className="px-[5px] text-xs text-foreground-tertiary">
                    {ocr.isPending ? '사업자등록증 정보를 인식하는 중...' : '업로드 중...'}
                </p>
            )}

            <DescriptionBlock type="info" title="사업자등록증을 첨부하면 자동으로 입력돼요">
                사업자번호·상호명·대표자명·개업일자를 자동으로 인식해 채워드려요. 인식 결과는 확인
                후 수정할 수 있어요.
            </DescriptionBlock>

            <TextInput
                label="사업자 등록번호"
                inputMode="numeric"
                placeholder="000-00-00000"
                value={business.businessNumber}
                onChange={(e) =>
                    patchBusiness({ businessNumber: formatBusinessNumber(e.target.value) })
                }
            />
            <TextInput
                label="상호명"
                placeholder="사업자등록증에 기재된 상호명을 입력해 주세요"
                value={business.businessName}
                onChange={(e) => patchBusiness({ businessName: e.target.value })}
            />
            <TextInput
                label="대표자명"
                placeholder="대표자 성명을 입력해 주세요"
                value={business.ownerName}
                onChange={(e) => patchBusiness({ ownerName: e.target.value })}
            />
            <TextInput
                label="개업일자"
                inputMode="numeric"
                maxLength={8}
                placeholder="예) 20190315"
                value={business.startDate}
                error={!!startDateError}
                helperText={startDateError}
                onChange={(e) =>
                    patchBusiness({ startDate: e.target.value.replace(/\D/g, '').slice(0, 8) })
                }
            />
            <TextInput
                label="사업장 주소"
                optional
                placeholder="사업자등록증에 기재된 주소를 입력해 주세요"
                value={business.businessAddress}
                onChange={(e) => patchBusiness({ businessAddress: e.target.value })}
            />

            <TextInput
                label="이메일"
                type="email"
                placeholder="예) todam@studio.com"
                value={business.email}
                onChange={(e) => patchBusiness({ email: e.target.value })}
            />

            <DescriptionBlock type="default" title="파트너 신청 안내">
                이미 등록된 사업자 번호는 중복 신청할 수 없어요. 공방이 이미 다른 계정에 연결되어
                있다면 고객센터로 문의해주세요.
            </DescriptionBlock>
        </div>
    );
}
