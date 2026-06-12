import { Logo } from '@todam/ui';
import Link from 'next/link';
import QRCode from 'qrcode';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://todam.app';

// QR 진입 출처 추적용 UTM (GA4에서 utm_source=qr 비율 확인).
function qrUrl(path: string, campaign: string): string {
    const url = new URL(path, APP_URL);
    url.searchParams.set('utm_source', 'qr');
    url.searchParams.set('utm_medium', 'brand_panel');
    url.searchParams.set('utm_campaign', campaign);
    return url.toString();
}

function renderQr(value: string): Promise<string> {
    return QRCode.toString(value, {
        type: 'svg',
        margin: 0,
        color: { dark: '#1a3d2b', light: '#ffffff' },
    });
}

/**
 * xl 이상 와이드 화면 좌측 브랜드 패널.
 * 배경 도예 사진은 layout 전역 레이어가 깔고, 이 패널은 로고·브랜드 카피·CTA·모바일 QR(고객·파트너)을
 * 좌측 정렬로 얹는다. (뷰포트 줄면 hidden → 앱 가운데 정렬)
 */
export async function BrandPanel() {
    const [customerQr, partnerQr] = await Promise.all([
        renderQr(qrUrl('/', 'customer')),
        renderQr(qrUrl('/partner', 'partner')),
    ]);

    return (
        <aside className="relative z-10 hidden w-[520px] shrink-0 flex-col justify-center gap-12 px-14 text-left xl:flex">
            <div className="flex flex-col items-start">
                <Logo color="brand" height={36} />

                <h1 className="mt-10 text-[34px] font-bold leading-tight tracking-tight text-primary">
                    당신의 작품이
                    <br />
                    머무는 시간
                </h1>
                <p className="mt-5 text-base leading-relaxed text-foreground/80">
                    예약부터 완성까지,
                    <br />내 작품의 여정을 토담에 기록하세요.
                </p>

                <Link
                    href="/search"
                    className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-foreground-inverse shadow-sm transition hover:bg-primary-darker"
                >
                    근처 공방 찾기
                </Link>
            </div>

            {/* 모바일 QR — 흰 카드 위아래 스택 (고객·파트너 분리 추적) */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-sm">
                    <div
                        aria-label="토담 고객용 모바일 접속 QR 코드"
                        className="size-16 shrink-0 [&>svg]:size-full"
                        dangerouslySetInnerHTML={{ __html: customerQr }}
                    />
                    <div>
                        <p className="text-base font-semibold text-foreground">
                            휴대폰으로 토담 열기
                        </p>
                        <p className="mt-0.5 text-sm text-foreground/60">
                            카메라로 QR을 스캔하세요
                        </p>
                    </div>
                </div>

                <Link
                    href="/partner"
                    className="group flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-sm transition hover:bg-primary-subtle"
                >
                    <div
                        aria-label="토담 파트너 등록 모바일 접속 QR 코드"
                        className="size-16 shrink-0 [&>svg]:size-full"
                        dangerouslySetInnerHTML={{ __html: partnerQr }}
                    />
                    <div>
                        <p className="text-base font-semibold text-foreground transition group-hover:text-primary">
                            파트너 등록하기
                        </p>
                        <p className="mt-0.5 text-sm text-foreground/60">
                            공방을 운영하고 계신가요?
                        </p>
                    </div>
                </Link>
            </div>

            <p className="text-sm font-medium text-foreground/75">
                홈 화면에 추가하면 앱처럼 이용할 수 있어요.
            </p>
        </aside>
    );
}
