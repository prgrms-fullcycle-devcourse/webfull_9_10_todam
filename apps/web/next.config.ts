const nextConfig = {
    transpilePackages: ['@todam/ui', '@todam/shared'],
    images: {
        remotePatterns: [
            // 디자인 확인용 placeholder 호스트 (S3 연동 단계에서 실 CDN 호스트로 교체).
            { protocol: 'https' as const, hostname: 'via.placeholder.com' },
            { protocol: 'https' as const, hostname: 'placehold.co' },
        ],
    },
};

export default nextConfig;
