import type { IconProps } from './types';

// 카카오 심볼은 카카오 브랜드 가이드라인의 고정 색상(#191919)을 사용한다(디자인 토큰 범위 밖).
export function KakaoIcon({ size = 24, color, className, style, ...props }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={color ? { color, ...style } : style}
            {...props}
        >
            <path
                d="M12 3C6.477 3 2 6.463 2 10.734c0 2.737 1.84 5.142 4.617 6.508-.153.532-.984 3.402-1.017 3.627 0 0-.02.17.09.235.11.066.24.015.24.015.31-.043 3.6-2.354 4.17-2.756.61.086 1.24.131 1.9.131 5.523 0 10-3.463 10-7.734C22 6.463 17.523 3 12 3Z"
                fill="#191919"
            />
        </svg>
    );
}
