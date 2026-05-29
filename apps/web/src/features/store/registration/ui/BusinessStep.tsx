'use client';

import { CameraIcon, DescriptionBlock, TextInput } from '@todam/ui';
import { useRef, useState } from 'react';

import { openPostcode } from '../../../../shared/lib/daumPostcode';
import { useToast } from '../../../../shared/model';
import { useStoreRegistrationStore } from '../model/store';
import { useGeocode } from '../queries';

export function BusinessStep() {
    const business = useStoreRegistrationStore((s) => s.form.business);
    const patchBusiness = useStoreRegistrationStore((s) => s.patchBusiness);
    const setAddress = useStoreRegistrationStore((s) => s.setAddress);
    const { push } = useToast();

    const fileRef = useRef<HTMLInputElement>(null);
    const [addrLoading, setAddrLoading] = useState(false);
    const geocodeMutation = useGeocode();

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // TODO(추후 연동): presigned 업로드 → documentUrl, OCR 자동입력 + 국세청 진위검증
        patchBusiness({ documentUrl: `mock://uploads/${file.name}` });
        push({ message: '사업자등록증이 첨부되었습니다.' });
    };

    const handleAddressSearch = async () => {
        if (addrLoading) return;
        setAddrLoading(true);
        try {
            const result = await openPostcode();
            const { latitude, longitude } = await geocodeMutation.mutateAsync(result.roadAddress);
            setAddress(result.roadAddress, latitude, longitude);
        } catch {
            push({ message: '주소 검색을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.' });
        } finally {
            setAddrLoading(false);
        }
    };

    const fileName = business.documentUrl?.replace('mock://uploads/', '');
    const hasAddress = business.businessAddress.trim().length > 0;

    return (
        <div className="flex flex-col gap-4">
            {/* 사업자 등록증 업로드 */}
            <div className="flex flex-col gap-2">
                <span className="px-[5px] text-sm font-semibold text-foreground-tertiary">
                    사업자 등록증
                </span>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    className="hidden"
                    onChange={handleFile}
                />
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex h-20 w-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-border text-foreground-tertiary"
                >
                    <CameraIcon size={24} />
                    {fileName && (
                        <span className="max-w-24 truncate px-1 text-[10px]">{fileName}</span>
                    )}
                </button>
            </div>

            <TextInput
                label="사업자 등록번호"
                placeholder="000-00-00000"
                value={business.businessNumber}
                onChange={(e) => patchBusiness({ businessNumber: e.target.value })}
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

            <div className="h-2" />

            <DescriptionBlock type="default" title="파트너 신청 안내">
                이미 등록된 사업자 번호는 중복 신청할 수 없어요. 공방이 이미 다른 계정에 연결되어
                있다면 고객센터로 문의해주세요.
            </DescriptionBlock>
        </div>
    );
}
