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
import { useStoreRegistrationStatus } from '../queries';

export function StoreRegistrationComplete({
    onClose,
    onEditInfo,
}: {
    onClose: () => void;
    onEditInfo: () => void;
}) {
    // dev 미리보기: window.__onboardingPreviewRejected = true 시 반려 화면
    const preview =
        typeof window !== 'undefined' &&
        (window as unknown as { __onboardingPreviewRejected?: boolean }).__onboardingPreviewRejected
            ? 'rejected'
            : undefined;
    const { data: status } = useStoreRegistrationStatus(preview);

    const rejected = status?.storeStatus === StoreStatus.REJECTED;

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
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

                {/* Container */}
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
                                    사유:{' '}
                                    {status?.rejectedReason ?? '반려 사유가 등록되지 않았습니다.'}
                                </p>
                                <Button variant="outline" size="sm" onClick={onEditInfo}>
                                    정보 수정하기
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* 공방 요약 */}
                    <ResultTable
                        title={status?.storeName ?? '-'}
                        location={status?.address}
                        rows={[
                            {
                                label: '사업자 등록번호',
                                value: status?.businessNumber ?? '-',
                                icon: <ConfirmIcon size={16} />,
                            },
                            {
                                label: '신청일시',
                                value: formatYmdHm(status?.createdAt ?? '') || '-',
                                icon: <ClockIcon size={16} />,
                            },
                            {
                                label: '이메일',
                                value: status?.email ?? '-',
                                icon: <EmailIcon size={16} />,
                            },
                        ]}
                    />
                </div>
            </div>

            <BottomBar>
                <Button className="w-full" onClick={onClose}>
                    홈으로
                </Button>
            </BottomBar>
        </div>
    );
}
