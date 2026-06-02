import type { IconProps } from './types';

// 구글 G 심볼은 구글 브랜드 가이드라인의 고정 멀티컬러를 사용한다(디자인 토큰 범위 밖).
export function GoogleIcon({ size = 24, color, className, style, ...props }: IconProps) {
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
                d="M21.805 12.227c0-.74-.066-1.452-.19-2.136H12v4.042h5.498a4.7 4.7 0 0 1-2.04 3.085v2.563h3.3c1.932-1.78 3.047-4.4 3.047-7.554Z"
                fill="#4285F4"
            />
            <path
                d="M12 22c2.76 0 5.075-.915 6.766-2.476l-3.3-2.563c-.915.614-2.085.977-3.466.977-2.665 0-4.922-1.8-5.727-4.218H2.86v2.646A9.997 9.997 0 0 0 12 22Z"
                fill="#34A853"
            />
            <path
                d="M6.273 13.72A5.99 5.99 0 0 1 5.955 12c0-.597.103-1.177.318-1.72V7.634H2.86A9.997 9.997 0 0 0 2 12c0 1.614.387 3.14 1.072 4.49l3.2-2.77Z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.98c1.502 0 2.85.516 3.91 1.53l2.932-2.93C17.07 2.99 14.755 2 12 2 7.99 2 4.55 4.299 2.86 7.634l3.413 2.646C7.078 7.86 9.335 5.98 12 5.98Z"
                fill="#EA4335"
            />
        </svg>
    );
}
