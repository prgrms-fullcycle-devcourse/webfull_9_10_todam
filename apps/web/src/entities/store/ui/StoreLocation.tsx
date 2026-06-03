import { MapIcon } from '@todam/ui';

import { StoreMap } from './StoreMap';

export type StoreLocationProps = {
    address: string;
    latitude?: number;
    longitude?: number;
    name?: string;
};

// 위치 섹션. 좌표 있으면 Kakao 지도(클릭 시 지도앱/웹), 없으면 placeholder. 그 아래 주소 텍스트.
export function StoreLocation({ address, latitude, longitude, name }: StoreLocationProps) {
    const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';
    return (
        <div className="flex flex-col gap-2">
            {hasCoords ? (
                <StoreMap
                    latitude={latitude}
                    longitude={longitude}
                    name={name ?? address}
                    address={address}
                />
            ) : (
                <div
                    className="grid h-32 w-full place-items-center rounded-2xl bg-muted text-xs font-medium text-foreground-tertiary"
                    aria-label="지도 영역"
                >
                    MAP
                </div>
            )}
            <div className="flex items-center gap-1 text-xs font-medium leading-4 text-foreground-tertiary">
                <MapIcon size={16} />
                <span>{address}</span>
            </div>
        </div>
    );
}
