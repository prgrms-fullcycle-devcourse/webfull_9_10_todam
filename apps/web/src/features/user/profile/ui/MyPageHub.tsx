'use client';

import { useRouter } from 'next/navigation';
import { Toggle } from '@todam/ui';

import { useEnablePush } from '@/features/notification';
import { MenuTable } from '@/shared/ui';
import { useToast } from '@/shared/model/toast';
import {
    useNotificationSettings,
    usePatchNotificationSettings,
} from '../../notification-settings/queries';

export interface CustomerSupportTerm {
    key: string;
    label: string;
}

export interface MyPageHubProps {
    isPartner: boolean;
    customerSupportTerms: CustomerSupportTerm[];
    onOpenTerms: (key: string) => void;
    onLogout: () => void;
}

export function MyPageHub({
    isPartner,
    customerSupportTerms,
    onOpenTerms,
    onLogout,
}: MyPageHubProps) {
    const router = useRouter();

    const { data: notifData } = useNotificationSettings();
    const patchNotif = usePatchNotificationSettings();
    const enablePush = useEnablePush();
    const { push: toast } = useToast();

    const webPushEnabled = notifData?.notificationSettings.webPushEnabled ?? false;

    // 푸시 알림 토글. ON = 브라우저 권한 요청 + 토큰 발급/등록(useEnablePush) 성공 시에만 서버 반영.
    // 권한 거부/미지원이면 토스트 안내 후 서버 patch 생략(토글은 서버값 유지 → 원복).
    const handleWebPushToggle = async (value: boolean) => {
        if (!value) {
            patchNotif.mutate({ webPushEnabled: false });
            return;
        }
        const result = await enablePush();
        if (!result.ok) {
            const message =
                result.reason === 'denied'
                    ? '브라우저 알림 권한이 거부됐어요. 브라우저 설정에서 허용해 주세요.'
                    : result.reason === 'unsupported'
                      ? '이 브라우저는 웹 푸시를 지원하지 않아요.'
                      : '알림을 켜지 못했어요. 잠시 후 다시 시도해 주세요.';
            toast({ message });
            return;
        }
        patchNotif.mutate({ webPushEnabled: true });
    };

    // 내 정보 섹션 메뉴 rows — 라벨만 isPartner로 분기(D6/D8). 목적지는 /partner 단일,
    // 비/미승인 파트너 redirect는 AppShell 온보딩 게이트가 처리(리뷰 #190 반영).
    const myInfoRows = [
        { label: '개인 정보 수정', onClick: () => router.push('/my/profile') },
        { label: '찜한 공방 목록', onClick: () => router.push('/my/favorites') },
        {
            label: isPartner ? '파트너 센터 이동하기' : '공방 등록하기',
            onClick: () => router.push('/partner'),
        },
    ];

    // 고객지원 섹션 메뉴 rows — 약관 항목 + 로그아웃(chevron 없음, muted).
    const customerSupportRows = [
        ...customerSupportTerms.map((term) => ({
            label: term.label,
            onClick: () => onOpenTerms(term.key),
        })),
        { label: '로그아웃', onClick: onLogout, showChevron: false, muted: true },
    ];

    return (
        <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 bg-background">
            {/* 내 정보 섹션 */}
            <section className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold text-foreground">내 정보</h2>
                <MenuTable rows={myInfoRows} />
            </section>

            {/* 알림 설정 섹션 */}
            <section className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold text-foreground">알림 설정</h2>
                <div className="flex flex-col rounded-2xl bg-surface px-4 py-1 w-full">
                    {/* 푸시 알림 토글 — ON 시 브라우저 권한+토큰 등록. 카테고리 분류·수신자는 서버가 처리 */}
                    <div className="flex items-center justify-between gap-3 py-3">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-foreground">푸시 알림</span>
                            <span className="text-xs text-foreground-tertiary">
                                기기로 알림을 받아요
                            </span>
                        </div>
                        <Toggle
                            checked={webPushEnabled}
                            onCheckedChange={(v) => void handleWebPushToggle(v)}
                            disabled={patchNotif.isPending}
                            aria-label="푸시 알림"
                        />
                    </div>
                </div>
            </section>

            {/* 고객지원 섹션 */}
            <section className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold text-foreground">고객지원</h2>
                <MenuTable rows={customerSupportRows} />
            </section>

            {/* Footer — TODAM v1.0.0 한 줄 가로 배치 (시안 Divider) */}
            <footer className="mt-auto pt-4 pb-2">
                <div className="h-px w-full bg-border-subtle mb-4" />
                <div className="flex items-center justify-center gap-1">
                    <span className="text-xs text-foreground-tertiary">TODAM</span>
                    <span className="text-xs font-semibold text-foreground-tertiary">v1.0.0</span>
                </div>
            </footer>
        </main>
    );
}
