'use client';

import { Button, HeartFillIcon, HeartIcon } from '@todam/ui';
import { useState } from 'react';

import { useToggleFavorite } from '../queries';

export type FavoriteToggleButtonProps = {
    storeId: string;
    initialFavorite?: boolean;
    onChange?: (isFavorite: boolean) => void;
    /** 토글 API 성공 후 추가 사이드이펙트 (예: 다른 쿼리 무효화). */
    onAfterSuccess?: (isFavorite: boolean) => void;
    className?: string;
};

// 공방 찜 토글 (유스케이스). 낙관적 업데이트 + 실패 시 롤백.
// 응답 필드 isFavorite 로 정합(true=등록됨 / false=해제됨).
export function FavoriteToggleButton({
    storeId,
    initialFavorite = false,
    onChange,
    onAfterSuccess,
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
                    const resolved = res.isFavorite;
                    if (resolved !== next) {
                        setIsFavorite(resolved);
                        onChange?.(resolved);
                    }
                    onAfterSuccess?.(resolved);
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
