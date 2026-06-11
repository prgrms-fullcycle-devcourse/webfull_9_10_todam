import { useParams } from 'react-router-dom';

export function StoreReviewDetailPage() {
    const { id } = useParams<{ id: string }>();
    return (
        <main className="mx-auto max-w-3xl p-6 text-foreground">
            <h1 className="text-2xl font-bold">공방 검수 상세</h1>
            <p className="text-foreground-secondary">store: {id}</p>
        </main>
    );
}
