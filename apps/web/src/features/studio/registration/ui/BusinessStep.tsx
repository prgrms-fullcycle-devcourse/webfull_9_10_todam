'use client';

import { formatBusinessNumber } from '@todam/shared';
import { DescriptionBlock, TextInput } from '@todam/ui';
import { useState } from 'react';

import { openPostcode } from '@/shared/lib/daumPostcode';
import { useToast } from '@/shared/model';
import { ImageUploadField, type ImageUploadGridItem } from '@/shared/ui';
import { useStudioRegistrationStore } from '../model/studio';
import { useGeocode, useUploadBusinessDocument } from '../queries';

export function BusinessStep() {
    const business = useStudioRegistrationStore((s) => s.form.business);
    const patchBusiness = useStudioRegistrationStore((s) => s.patchBusiness);
    const setAddress = useStudioRegistrationStore((s) => s.setAddress);
    const { push } = useToast();

    const [addrLoading, setAddrLoading] = useState(false);
    const geocodeMutation = useGeocode();

    // 업로드한 파일의 로컬 미리보기 URL. 이미지일 때만 썸네일(PDF 는 라벨 유지).
    const [docPreview, setDocPreview] = useState<{ src: string; name: string } | null>(null);
    const uploadDoc = useUploadBusinessDocument();

    const handleAddDocument = async (files: File[]) => {
        const file = files[0];
        if (!file || uploadDoc.isPending) return;
        // TODO(백로그): OCR 자동입력 + 국세청 진위검증
        try {
            const { documentUrl } = await uploadDoc.mutateAsync(file);
            patchBusiness({ documentUrl });
            const isImage = file.type.startsWith('image/');
            setDocPreview({
                src: isImage ? URL.createObjectURL(file) : '',
                name: file.name,
            });
            push({ message: '사업자등록증이 첨부되었습니다.' });
        } catch {
            push({ message: '사업자등록증 업로드에 실패했어요. 잠시 후 다시 시도해주세요.' });
        }
    };

    const handleRemoveDocument = () => {
        if (docPreview?.src) URL.revokeObjectURL(docPreview.src);
        setDocPreview(null);
        patchBusiness({ documentUrl: null });
    };

    const handleAddressSearch = async () => {
        if (addrLoading) return;
        setAddrLoading(true);
        try {
            const result = await openPostcode();
            // 좌표 변환(Kakao)은 실패해도 주소 선택 자체는 유지(키 미설정 등 graceful). 좌표는 0/0 폴백.
            let latitude = 0;
            let longitude = 0;
            try {
                const coords = await geocodeMutation.mutateAsync(result.roadAddress);
                latitude = coords.latitude;
                longitude = coords.longitude;
            } catch {
                push({ message: '주소 좌표를 가져오지 못했어요. 위치 정보 없이 저장됩니다.' });
            }
            setAddress(result.roadAddress, latitude, longitude);
        } catch {
            push({ message: '주소 검색을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.' });
        } finally {
            setAddrLoading(false);
        }
    };

    const hasAddress = business.businessAddress.trim().length > 0;

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
            {/* 사업자 등록증 업로드 */}
            <ImageUploadField
                label="사업자 등록증"
                items={documentItems}
                onAdd={handleAddDocument}
                max={1}
                multiple={false}
                accept="image/jpeg,image/png,application/pdf"
                addDisabled={uploadDoc.isPending}
            />

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

            {/* 사업장 주소: 클릭 → 주소검색, 선택 후 상세주소 활성화 */}
            <div className="flex flex-col gap-2">
                <TextInput
                    label="사업장 주소"
                    placeholder="도로명 또는 지번 주소를 검색해 주세요"
                    value={business.businessAddress}
                    readOnly
                    onClick={handleAddressSearch}
                    className="cursor-pointer"
                />
                <TextInput
                    placeholder={
                        hasAddress ? '상세주소를 입력해 주세요' : '주소 검색 후 입력할 수 있어요'
                    }
                    value={business.addressDetail}
                    disabled={!hasAddress}
                    onChange={(e) => patchBusiness({ addressDetail: e.target.value })}
                />
            </div>

            <TextInput
                label="이메일"
                type="email"
                placeholder="예) leadem@studio.com"
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
