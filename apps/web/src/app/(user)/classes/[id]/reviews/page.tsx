import { Suspense } from 'react';

import { ClassReviewsClient } from '@/features/program/reviews';

export default function ClassReviewsPage() {
    return (
        <Suspense fallback={<ClassReviewsLoading />}>
            <ClassReviewsClient />
        </Suspense>
    );
}

function ClassReviewsLoading() {
    return (
        <main className="flex min-h-full items-center justify-center bg-[#FBF8F3] px-4 text-center">
            <p className="text-sm text-foreground-secondary">클래스 리뷰를 불러오는 중...</p>
        </main>
    );
}
