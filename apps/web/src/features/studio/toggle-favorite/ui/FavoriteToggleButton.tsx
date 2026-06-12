'use client';

import { Button, HeartFillIcon, HeartIcon } from '@todam/ui';
import { useState } from 'react';

import { ApiError } from '@/shared/api';
import { useToast } from '@/shared/model';

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
    const { push } = useToast();

    const handleClick = () => {
        const next = !isFavorite;
        setIsFavorite(next); // 낙관적
        onChange?.(next);
        toggle.mutate(
            { storeId },
            {
                onError: (err) => {
                    setIsFavorite(!next); // 롤백
                    onChange?.(!next);
                    // 401 은 AuthProvider 전역 핸들러가 로그인 모달로 안내하므로 토스트 생략.
                    // (그 외 404/500/네트워크 실패는 무반응이 되지 않도록 토스트 노출 — FavoritesListClient 정합.)
                    if (err instanceof ApiError && err.statusCode === 401) return;
                    push({ type: 'icon', message: '찜 상태 변경에 실패했습니다.' });
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
