'use client';

import { formatYmdHm, StoreStatus } from '@todam/shared';
import {
    Badge,
    BottomBar,
    Button,
    CheckIcon,
    ClockIcon,
    CloseIcon,
    ConfirmIcon,
    DotIcon,
    EmailIcon,
} from '@todam/ui';

import { ResultTable } from '@/shared/ui';

type Props = {
    storeName: string;
    // PENDING(심사 중) | REJECTED(반려) 만 진입.
    status: StoreStatus;
    rejectedReason?: string | null;
    address?: string;
    businessNumber?: string;
    email?: string;
    createdAt?: string;
    onEditInfo: () => void;
    onBack: () => void;
};

// 심사중·반려 공방 진입 시 결과(검수 상태) 화면. 일반 상세 대신 노출.
// 심사 결과는 스토어 단위(store.status) 기준.
export function StoreReviewResult({
    storeName,
    status,
    rejectedReason,
    address,
    businessNumber,
    email,
    createdAt,
    onEditInfo,
    onBack,
}: Props) {
    const rejected = status === StoreStatus.REJECTED;

    return (
        <div className="flex h-full flex-col bg-background">
            {/* 검수 결과 안내 전용 화면 → 헤더 없음(검토중·반려 동일). 이동은 하단 버튼. */}
            <div className="flex flex-1 flex-col overflow-y-auto">
                {/* hero */}
                <section
                    className="flex h-60 flex-col items-center justify-end gap-7 px-4 pb-2"
                    style={{
                        background: rejected
                            ? 'linear-gradient(180deg, rgba(246,125,119,0.6) 0%, rgba(255,255,255,0) 100%)'
                            : 'linear-gradient(180deg, rgba(125,194,132,0.6) 0%, rgba(255,255,255,0) 100%)',
                    }}
                >
                    <div
                        className={[
                            'flex h-16 w-16 items-center justify-center rounded-full text-foreground-inverse',
                            rejected ? 'bg-danger' : 'bg-success',
                        ].join(' ')}
                    >
                        {rejected ? <CloseIcon size={24} /> : <CheckIcon size={24} />}
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <h2 className="text-2xl font-extrabold text-foreground">
                            {rejected ? '공방 등록이 반려되었어요' : '등록한 공방을 검토중이에요'}
                        </h2>
                        <p className="text-sm text-foreground-secondary">
                            {rejected
                                ? '아래 반려 사유를 확인하고 정보를 수정해 주세요'
                                : '영업일 2~3일 내에 승인 결과를 이메일로 알려드릴게요'}
                        </p>
                    </div>
                </section>

                <div className="flex flex-col gap-2 px-4 pb-16 pt-2">
                    {/* 검수 상태 카드 */}
                    <div className="flex flex-col gap-3 rounded-2xl bg-surface px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-base font-bold text-foreground">
                                    {rejected ? '서류 반려' : '서류 검토'}
                                </span>
                                <span className="text-xs text-foreground-tertiary">
                                    사업자・공방 정보 확인
                                </span>
                            </div>
                            <Badge tone={rejected ? 'danger' : 'info'} icon={<DotIcon />}>
                                {rejected ? '반려' : '검토 중'}
                            </Badge>
                        </div>

                        {rejected && (
                            <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
                                <p className="text-xs text-foreground-secondary">
                                    사유: {rejectedReason ?? '반려 사유가 등록되지 않았습니다.'}
                                </p>
                                <Button variant="outline" size="sm" onClick={onEditInfo}>
                                    정보 수정하기
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* 공방 요약 */}
                    <ResultTable
                        title={storeName}
                        location={address}
                        rows={[
                            {
                                label: '사업자 등록번호',
                                value: businessNumber ?? '-',
                                icon: <ConfirmIcon size={16} />,
                            },
                            {
                                label: '신청일시',
                                value: formatYmdHm(createdAt ?? '') || '-',
                                icon: <ClockIcon size={16} />,
                            },
                            {
                                label: '이메일',
                                value: email ?? '-',
                                icon: <EmailIcon size={16} />,
                            },
                        ]}
                    />
                </div>
            </div>

            <BottomBar>
                <Button className="w-full" onClick={onBack}>
                    목록으로
                </Button>
            </BottomBar>
        </div>
    );
}
