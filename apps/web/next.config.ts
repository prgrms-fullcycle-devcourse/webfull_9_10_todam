const nextConfig = {
    transpilePackages: ['@todam/ui', '@todam/shared'],
    // 폰 실기 테스트용 cloudflare quick tunnel 의 cross-origin dev 요청 허용 (dev 전용).
    allowedDevOrigins: ['*.trycloudflare.com'],
    images: {
        remotePatterns: [
            // 디자인 확인용 placeholder 호스트 (S3 연동 단계에서 실 CDN 호스트로 교체).
            { protocol: 'https' as const, hostname: 'via.placeholder.com' },
            { protocol: 'https' as const, hostname: 'placehold.co' },
            // 실 이미지 호스트 (BE s3-object.util.ts 기준): CDN + 레거시 S3 둘 다 응답에 올 수 있음.
            { protocol: 'https' as const, hostname: 'cdn.todam.app' },
            {
                protocol: 'https' as const,
                hostname: 'todam-prod-assets.s3.ap-northeast-2.amazonaws.com',
            },
        ],
    },
};

export default nextConfig;
