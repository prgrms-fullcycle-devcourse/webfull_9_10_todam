import { MapIcon } from '@todam/ui';

export type StoreLocationProps = {
    address: string;
};

// 위치 섹션 표현 컴포넌트. 지도 영역은 placeholder(실 지도 SDK 연동은 follow-up),
// 그 아래 주소 텍스트만 노출. 순수 표현 — 데이터페치·라우팅 없음.
export function StoreLocation({ address }: StoreLocationProps) {
    return (
        <div className="flex flex-col gap-2">
            {/* 지도 placeholder — 실 지도 연동은 별도 작업(map SDK) */}
            <div
                className="grid h-32 w-full place-items-center rounded-2xl bg-muted text-xs font-medium text-foreground-tertiary"
                aria-label="지도 영역"
            >
                MAP
            </div>
            <div className="flex items-center gap-1 text-xs font-medium leading-4 text-foreground-tertiary">
                <MapIcon size={16} />
                <span>{address}</span>
            </div>
        </div>
    );
}
