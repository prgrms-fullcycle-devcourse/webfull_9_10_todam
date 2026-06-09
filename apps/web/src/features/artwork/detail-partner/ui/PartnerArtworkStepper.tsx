// 파트너 작품 상세 스텝퍼.
// Decision Log 2026-06-09 B안: 단계 아이콘은 StepperIcon 원 "안"에 들어간다.
//   - completed → 체크, current/upcoming → 단계 아이콘. variant 별 색.
// 유저 read-only entities/artwork/ui/Stepper 는 건드리지 않는다.

import type { ComponentType } from 'react';
import {
    SunIcon,
    FireIcon,
    WaterIcon,
    FireDoubleIcon,
    DeliveryIcon,
    FlagIcon,
    LeafIcon,
} from '@todam/ui';
import { StepperIcon, ImageUploadGrid } from '@/shared/ui';
import type { TimelineRow } from '../timeline';

type SizeProps = { size?: number };

const STEP_ICON_MAP: Record<string, ComponentType<SizeProps>> = {
    VISITED: LeafIcon,
    DRYING: SunIcon,
    BISQUE_FIRING: FireIcon,
    GLAZING: WaterIcon,
    GLAZE_FIRING: FireDoubleIcon,
    shipping: DeliveryIcon,
    delivered: FlagIcon,
    pickup_ready: DeliveryIcon,
    pickup_done: FlagIcon,
};

export type PartnerArtworkStepperProps = {
    rows: TimelineRow[];
    onUpload?: (rowKey: string, artworkLogId: string, files: File[]) => void;
    onRemovePhoto?: (rowKey: string, index: number) => void;
};

export function PartnerArtworkStepper({
    rows,
    onUpload,
    onRemovePhoto,
}: PartnerArtworkStepperProps) {
    return (
        <div className="flex flex-col">
            {rows.map((row, idx) => {
                const isLast = idx === rows.length - 1;
                const StageIcon = STEP_ICON_MAP[row.key] ?? LeafIcon;

                const connectorClass =
                    row.state === 'completed' ? 'bg-success-lighter' : 'bg-muted';

                return (
                    <div key={row.key} className="flex gap-3">
                        <div className="flex w-7 shrink-0 flex-col items-center">
                            <StepperIcon
                                shape="circle"
                                status={row.state}
                                icon={StageIcon}
                                className="shrink-0"
                            />
                            {!isLast && <div className={`w-0.5 flex-1 ${connectorClass}`} />}
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col gap-3 pb-5">
                            <div className="flex flex-col gap-1">
                                {/* 미완료 단계는 날짜 자리를 '-' 로 채워 정렬 유지 */}
                                <p className="text-xs text-foreground-tertiary">
                                    {row.date ?? '-'}
                                </p>
                                <p
                                    className={`text-base font-semibold leading-5 ${row.state === 'upcoming' ? 'text-foreground-tertiary' : 'text-foreground'}`}
                                >
                                    {row.label}
                                </p>
                            </div>

                            {row.editable && (
                                <ImageUploadGrid
                                    items={row.photos.map((p, i) => ({
                                        src: p.src,
                                        key: `${row.key}-${i}`,
                                        alt: p.alt,
                                        onRemove: onRemovePhoto
                                            ? () => onRemovePhoto(row.key, i)
                                            : undefined,
                                    }))}
                                    onAdd={(files) => {
                                        // 업로드는 단계 로그 id 필요. 없으면 무시(현재단계는 항상 존재).
                                        if (row.artworkLogId) {
                                            onUpload?.(row.key, row.artworkLogId, files);
                                        }
                                    }}
                                    max={5}
                                    multiple
                                    cellSize="h-16 w-16"
                                />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
