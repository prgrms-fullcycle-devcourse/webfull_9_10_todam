'use client';

import { PhoneIcon, ShareIcon } from '@todam/ui';

import { useToast } from '@/shared/model';

// 평점 행 우측 액션(문의하기/공유하기). 아이콘 + 라벨만 배치. user/partner 공용.
// 문의하기 = 공방 전화번호로 tel: 다이얼(미등록 시 비표시). 공유하기 = 고객용 공개 페이지(/studio/{slug}) 링크 공유.
export function StudioInfoActions({
    phone,
    slug,
    storeName,
}: {
    phone: string | null;
    slug: string;
    storeName: string;
}) {
    const { push } = useToast();
    // phone 미등록(null) 공방은 전화 링크 비표시.
    const telHref = phone ? `tel:${phone.replace(/[^0-9+]/g, '')}` : null;

    async function handleShare() {
        const url = `${window.location.origin}/studio/${slug}`;
        if (typeof navigator.share === 'function') {
            try {
                await navigator.share({ title: storeName, url });
                return;
            } catch (e) {
                if (e instanceof Error && e.name === 'AbortError') return;
            }
        }
        try {
            await navigator.clipboard.writeText(url);
            push({ message: '공방 링크를 복사했어요.' });
        } catch {
            push({ message: '링크 복사에 실패했어요.' });
        }
    }

    return (
        <>
            {telHref && (
                <>
                    <span className="text-foreground-tertiary">・</span>
                    <a
                        href={telHref}
                        className="inline-flex items-center gap-1 text-xs font-medium text-foreground-tertiary hover:text-foreground"
                    >
                        <PhoneIcon size={16} />
                        <span>문의하기</span>
                    </a>
                </>
            )}
            <span className="text-foreground-tertiary">・</span>
            <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-foreground-tertiary hover:text-foreground"
                onClick={handleShare}
            >
                <ShareIcon size={16} />
                <span>공유하기</span>
            </button>
        </>
    );
}
