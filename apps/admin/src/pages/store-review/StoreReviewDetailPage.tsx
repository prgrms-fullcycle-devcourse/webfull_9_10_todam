import { useQuery } from '@tanstack/react-query';
import { StoreStatus } from '@todam/shared';
import { Button } from '@todam/ui';
import { useNavigate, useParams } from 'react-router-dom';

import { getAdminStoreDetail } from '@/features/store-review/api';
import {
    BusinessStateBadge,
    StoreStatusBadge,
    VerificationBadge,
} from '@/features/store-review/ui/StatusBadges';
import { DetailCard, Field } from '@/features/store-review/ui/DetailParts';
import { StoreActionPanel } from '@/features/store-review/ui/StoreActionPanel';
import { formatDate, formatDateTime, formatYmd } from '@/shared/lib/format';

function regionText(...parts: (string | null)[]): string {
    const joined = parts.filter(Boolean).join(' ');
    return joined || '-';
}

export function StoreReviewDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const query = useQuery({
        queryKey: ['admin', 'store', id],
        queryFn: () => getAdminStoreDetail(id as string),
        enabled: Boolean(id),
    });

    return (
        <div className="flex flex-col gap-6">
            <Button
                variant="ghost"
                size="sm"
                className="self-start !px-2"
                onClick={() => navigate(-1)}
            >
                ← 목록으로
            </Button>

            {query.isError ? (
                <div className="rounded-2xl border border-danger-lighter bg-danger-subtle px-4 py-16 text-center text-sm text-danger-darker">
                    공방 정보를 불러오지 못했습니다.
                </div>
            ) : query.isLoading || !query.data ? (
                <div className="rounded-2xl border border-border-subtle bg-surface px-4 py-16 text-center text-sm text-foreground-tertiary">
                    불러오는 중…
                </div>
            ) : (
                (() => {
                    const { store, businessDocument, partner } = query.data;
                    return (
                        <>
                            <header className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl font-bold text-foreground">
                                            {store.name}
                                        </h1>
                                        <StoreStatusBadge status={store.status} />
                                    </div>
                                    <p className="text-sm text-foreground-tertiary">
                                        신청일 {formatDate(store.createdAt)}
                                    </p>
                                </div>
                                <StoreActionPanel storeId={store.id} status={store.status} />
                            </header>

                            {store.status === StoreStatus.REJECTED && store.rejectedReason && (
                                <div className="rounded-2xl border border-danger-lighter bg-danger-subtle px-4 py-3 text-sm text-danger-darker">
                                    <span className="font-semibold">반려 사유 </span>
                                    {store.rejectedReason}
                                </div>
                            )}
                            {store.status === StoreStatus.SUSPENDED && store.suspendedReason && (
                                <div className="rounded-2xl border border-info-lighter bg-info-subtle px-4 py-3 text-sm text-info-darker">
                                    <span className="font-semibold">노출 중단 사유 </span>
                                    {store.suspendedReason}
                                </div>
                            )}

                            {store.images.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {store.images.map((img) => (
                                        <div
                                            key={img.imageUrl}
                                            className="relative aspect-square overflow-hidden rounded-xl border border-border-subtle bg-muted"
                                        >
                                            <img
                                                src={img.imageUrl}
                                                alt={store.name}
                                                className="h-full w-full object-cover"
                                            />
                                            {img.isThumbnail && (
                                                <span className="absolute left-2 top-2 rounded-full bg-inverse/70 px-2 py-0.5 text-[10px] font-medium text-foreground-inverse">
                                                    대표
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="grid gap-4 lg:grid-cols-2">
                                <DetailCard title="공방 정보">
                                    <Field label="소개">{store.description}</Field>
                                    <Field label="지역">
                                        {regionText(
                                            store.regionSido,
                                            store.regionSigungu,
                                            store.regionDong,
                                        )}
                                    </Field>
                                    <Field label="주소">{store.address}</Field>
                                    <Field label="전화">{store.phone}</Field>
                                    <Field label="편의시설">
                                        {store.convenienceInfo
                                            ? [
                                                  store.convenienceInfo.parking && '주차',
                                                  store.convenienceInfo.pet && '반려동물',
                                                  store.convenienceInfo.wifi && '와이파이',
                                              ]
                                                  .filter(Boolean)
                                                  .join(' · ') || '없음'
                                            : '-'}
                                    </Field>
                                </DetailCard>

                                <DetailCard title="예약 설정">
                                    <Field label="예약 단위">
                                        {store.reservationIntervalMinutes
                                            ? `${store.reservationIntervalMinutes}분`
                                            : '-'}
                                    </Field>
                                    <Field label="슬롯당 정원">
                                        {store.maxCapacityPerSlot
                                            ? `${store.maxCapacityPerSlot}명`
                                            : '-'}
                                    </Field>
                                    <Field label="취소 마감">
                                        {store.cancelDeadlineDays != null
                                            ? `${store.cancelDeadlineDays}일 전`
                                            : '-'}
                                    </Field>
                                    <Field label="자동 확정">
                                        {store.autoConfirm ? '사용' : '미사용'}
                                    </Field>
                                    <Field label="노출 시작">
                                        {formatDateTime(store.publishedAt)}
                                    </Field>
                                </DetailCard>

                                <DetailCard title="사업자 정보">
                                    {businessDocument ? (
                                        <>
                                            <Field label="진위확인">
                                                <span className="flex items-center gap-2">
                                                    <VerificationBadge
                                                        status={businessDocument.verificationStatus}
                                                    />
                                                    {businessDocument.businessState && (
                                                        <BusinessStateBadge
                                                            state={businessDocument.businessState}
                                                        />
                                                    )}
                                                </span>
                                            </Field>
                                            <Field label="상호">
                                                {businessDocument.businessName}
                                            </Field>
                                            <Field label="대표자">
                                                {businessDocument.ownerName}
                                            </Field>
                                            <Field label="사업자번호">
                                                {businessDocument.businessNumber}
                                            </Field>
                                            <Field label="사업장 주소">
                                                {businessDocument.businessAddress}
                                            </Field>
                                            <Field label="개업일자">
                                                {formatYmd(businessDocument.startDate)}
                                            </Field>
                                            <Field label="확인 시각">
                                                {formatDateTime(businessDocument.verifiedAt)}
                                            </Field>
                                            <Field label="등록증">
                                                {businessDocument.documentUrl ? (
                                                    <a
                                                        href={businessDocument.documentUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-primary underline"
                                                    >
                                                        원본 보기
                                                    </a>
                                                ) : (
                                                    '-'
                                                )}
                                            </Field>
                                        </>
                                    ) : (
                                        <p className="text-sm text-foreground-tertiary">
                                            제출된 사업자 서류가 없습니다.
                                        </p>
                                    )}
                                </DetailCard>

                                <DetailCard title="파트너 정보">
                                    <Field label="닉네임">{partner.nickname}</Field>
                                    <Field label="이메일">{partner.email}</Field>
                                </DetailCard>
                            </div>

                            {businessDocument?.documentUrl && (
                                <div className="flex justify-end">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            window.open(
                                                businessDocument.documentUrl as string,
                                                '_blank',
                                                'noreferrer',
                                            )
                                        }
                                    >
                                        사업자등록증 원본 열기
                                    </Button>
                                </div>
                            )}
                        </>
                    );
                })()
            )}
        </div>
    );
}
