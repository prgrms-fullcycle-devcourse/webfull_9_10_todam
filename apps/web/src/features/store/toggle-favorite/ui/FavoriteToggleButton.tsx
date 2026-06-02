'use client';

import { Button, HeartFillIcon, HeartIcon } from '@todam/ui';
import { useState } from 'react';

import { useToggleFavorite } from '../queries';

export type FavoriteToggleButtonProps = {
    storeId: string;
    initialFavorite?: boolean;
    onChange?: (isFavorite: boolean) => void;
    className?: string;
};

// 공방 찜 토글 (유스케이스). 낙관적 업데이트 + 실패 시 롤백.
// 응답 필드 isFavorite 로 정합(true=등록됨 / false=해제됨).
export function FavoriteToggleButton({
    storeId,
    initialFavorite = false,
    onChange,
    className,
}: FavoriteToggleButtonProps) {
    const [isFavorite, setIsFavorite] = useState(initialFavorite);
    const toggle = useToggleFavorite();

    const handleClick = () => {
        const next = !isFavorite;
        setIsFavorite(next); // 낙관적
        onChange?.(next);
        toggle.mutate(
            { storeId },
            {
                onError: () => {
                    setIsFavorite(!next); // 롤백
                    onChange?.(!next);
                },
                onSuccess: (res) => {
                    if (res.isFavorite !== next) {
                        setIsFavorite(res.isFavorite);
                        onChange?.(res.isFavorite);
                    }
                },
            },
        );
    };

    return (
        <Button
            variant="overlay"
            layout="onlyIcon"
            size="sm"
            icon={isFavorite ? <HeartFillIcon /> : <HeartIcon />}
            aria-label={isFavorite ? '찜 해제' : '찜하기'}
            onClick={handleClick}
            disabled={toggle.isPending}
            className={['shrink-0', className].filter(Boolean).join(' ')}
        />
    );
}
