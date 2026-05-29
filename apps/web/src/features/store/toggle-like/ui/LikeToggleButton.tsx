'use client';

import { Button, HeartFillIcon, HeartIcon } from '@todam/ui';
import { useState } from 'react';

import { useToggleLike } from '../queries';

export type LikeToggleButtonProps = {
    storeId: string;
    initialLiked?: boolean;
    onChange?: (liked: boolean) => void;
    className?: string;
};

// 찜 토글 (유스케이스). 낙관적 업데이트 + 실패 시 롤백.
export function LikeToggleButton({
    storeId,
    initialLiked = false,
    onChange,
    className,
}: LikeToggleButtonProps) {
    const [liked, setLiked] = useState(initialLiked);
    const toggle = useToggleLike();

    const handleClick = () => {
        const next = !liked;
        setLiked(next); // 낙관적
        onChange?.(next);
        toggle.mutate(
            { storeId, liked: next },
            {
                onError: () => {
                    setLiked(!next); // 롤백
                    onChange?.(!next);
                },
                onSuccess: (res) => {
                    if (res.liked !== next) {
                        setLiked(res.liked);
                        onChange?.(res.liked);
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
            icon={liked ? <HeartFillIcon /> : <HeartIcon />}
            aria-label={liked ? '찜 해제' : '찜하기'}
            onClick={handleClick}
            disabled={toggle.isPending}
            className={['shrink-0', className].filter(Boolean).join(' ')}
        />
    );
}
