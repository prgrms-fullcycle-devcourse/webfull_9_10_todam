'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { StoreStatus } from '@todam/shared';

import { useStoreRegistrationStatus } from '../../features/store/registration';

const sections = [
    { title: '대기 중인 예약', count: 4 },
    { title: '오늘의 일정', count: 4 },
    { title: '제작 중인 작품', count: 4 },
];

export default function PartnerHomePage() {
    const router = useRouter();
    // 등록 신청 내역(onboarding)이 있고 아직 미게시면 검수 결과 화면으로. 시드 공방엔 onboarding 없음.
    const { data: onboarding } = useStoreRegistrationStatus();
    const pendingReview =
        !!onboarding && onboarding.storeStatus !== StoreStatus.PUBLISHED
            ? onboarding.storeId
            : null;

    useEffect(() => {
        if (pendingReview) {
            router.replace(`/partner/stores/${pendingReview}`);
        }
    }, [pendingReview, router]);

    // 리다이렉트 직전 깜빡임 방지.
    if (pendingReview) return null;

    return (
        <>
            <main className="flex-1 overflow-y-auto">
                {/* hero: 메인 비주얼 콘텐츠 배치 영역 */}
                <section className="flex h-56 items-center justify-center bg-primary-subtle text-primary">
                    Hero 콘텐츠 배치
                </section>

                {/* Container: 좌/우 패딩 + 섹션 간 gap */}
                <div className="flex flex-col gap-6 px-4 py-6">
                    {sections.map(({ title, count }) => (
                        <section key={title} className="flex flex-col gap-3 py-2">
                            <h2 className="text-base font-semibold text-foreground">{title}</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {Array.from({ length: count }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex h-28 items-center justify-center rounded-xl bg-muted text-sm text-foreground-tertiary"
                                    >
                                        card
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </main>
        </>
    );
}
