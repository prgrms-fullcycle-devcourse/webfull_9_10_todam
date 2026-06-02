'use client';

// 403/404/기타 에러 안내 화면.
export type ArtworkDetailErrorProps = {
    statusCode: number;
};

export function ArtworkDetailError({ statusCode }: ArtworkDetailErrorProps) {
    const message =
        statusCode === 404
            ? '작품을 찾을 수 없습니다.'
            : statusCode === 403
              ? '해당 작품에 대한 접근 권한이 없습니다.'
              : '작품 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
    return <p className="py-10 text-center text-sm text-foreground-tertiary">{message}</p>;
}
