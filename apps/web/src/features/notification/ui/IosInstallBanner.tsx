'use client';

import { useEffect, useRef } from 'react';
import { StandardBottomSheet } from '@todam/ui';
import { useSheet } from '@/shared/model/sheet';

const DISMISS_KEY = 'ios-install-banner-dismissed';

/**
 * iOS Safari + 미설치(standalone 아님) 환경에서만 노출하는 "홈화면 추가" 안내 시트.
 * - iOS Web Push는 PWA 설치 후에만 작동하므로 설치를 유도한다.
 * - 자동 프롬프트 없음(iOS 제한). 수동 공유 메뉴 가이드만 제공.
 * - 공용 바텀시트(useSheet/AppSheet) 위에 렌더 — drag-to-close·dim 처리는 렌더러가 담당.
 * - 세션 스토리지로 한 번 닫으면 재노출하지 않는다.
 * - 화면 출력 없음(부수효과 전용). return null.
 */
export function IosInstallBanner() {
    const { open, close } = useSheet();
    const openedRef = useRef(false);

    useEffect(() => {
        if (openedRef.current) return;

        const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const dismissed = sessionStorage.getItem(DISMISS_KEY) === '1';

        if (!isIos || isStandalone || dismissed) return;

        openedRef.current = true;

        const dismiss = () => {
            sessionStorage.setItem(DISMISS_KEY, '1');
            close();
        };

        open(
            <StandardBottomSheet
                title="홈 화면에 추가하기"
                subTitle="todam 알림을 받으려면 홈 화면에 앱을 추가해 주세요."
                actionLabel="확인"
                onAction={dismiss}
                subLabel="오늘은 그냥 볼게요"
                onSub={dismiss}
            >
                <ol className="flex flex-col gap-3 text-sm text-foreground-secondary">
                    <li className="flex items-center gap-2">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-foreground-inverse">
                            1
                        </span>
                        Safari 하단 공유 버튼(<span className="font-medium">↑</span>)을 누르세요.
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-foreground-inverse">
                            2
                        </span>
                        <span>
                            <span className="font-medium">&quot;홈 화면에 추가&quot;</span>를
                            선택하세요.
                        </span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-foreground-inverse">
                            3
                        </span>
                        오른쪽 상단 <span className="font-medium">&quot;추가&quot;</span>를 누르면
                        완료입니다.
                    </li>
                </ol>
            </StandardBottomSheet>,
        );
    }, [open, close]);

    return null;
}
