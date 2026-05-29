import type { HTMLAttributes } from 'react';
import { CameraIcon, CloseIcon } from '@todam/ui';

export type StepperItemChildImage = {
    src: string;
    alt?: string;
};

export type StepperItemChildProps = {
    title: string;
    date?: string;
    images?: StepperItemChildImage[];
    /** 파트너 편집 모드. true면 썸네일 삭제 버튼 + 사진 추가 버튼 노출 */
    editable?: boolean;
    /** 편집 모드에서 추가 가능한 최대 이미지 수 */
    maxImages?: number;
    /** 썸네일 삭제 버튼 클릭. editable + 핸들러 있을 때만 X 노출 */
    onRemoveImage?: (index: number) => void;
    /** 사진 추가 버튼 클릭. editable + 핸들러 있고 max 미만일 때만 노출 */
    onAddMedia?: () => void;
} & HTMLAttributes<HTMLDivElement>;

export function StepperItemChild({
    title,
    date,
    images,
    editable = false,
    maxImages = 5,
    onRemoveImage,
    onAddMedia,
    className,
    ...props
}: StepperItemChildProps) {
    const items = images ?? [];
    const canAdd = editable && onAddMedia && items.length < maxImages;
    const hasMedia = items.length > 0 || canAdd;

    return (
        <div
            className={['flex flex-col gap-3 pb-5', className].filter(Boolean).join(' ')}
            {...props}
        >
            <div className="flex flex-col gap-1">
                {date && <p className="text-xs text-foreground-tertiary">{date}</p>}
                <p className="text-base font-semibold leading-5 text-foreground">{title}</p>
            </div>
            {hasMedia && (
                <div className={editable ? 'flex flex-wrap gap-4' : 'flex gap-2'}>
                    {items.map((image, index) => (
                        <div key={index} className="relative h-16 w-16 shrink-0">
                            <img
                                src={image.src}
                                alt={image.alt ?? ''}
                                className="h-full w-full rounded-lg bg-muted object-cover"
                            />
                            {editable && onRemoveImage && (
                                <button
                                    type="button"
                                    aria-label="이미지 삭제"
                                    onClick={() => onRemoveImage(index)}
                                    className="absolute -right-1 -top-1 grid h-5 w-5 cursor-pointer place-items-center rounded-full bg-foreground-secondary text-foreground-inverse"
                                >
                                    <CloseIcon size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                    {canAdd && (
                        <button
                            type="button"
                            aria-label="사진 추가"
                            onClick={onAddMedia}
                            className="grid h-16 w-16 shrink-0 cursor-pointer place-items-center rounded-lg border border-dashed border-border text-foreground-tertiary"
                        >
                            <CameraIcon size={24} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
