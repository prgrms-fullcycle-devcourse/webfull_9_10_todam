const sections = [
    { title: '추천 공방', count: 4 },
    { title: '인기 클래스', count: 4 },
    { title: '새로 열린 공방', count: 4 },
];

export default function HomePage() {
    return (
        <>
            {/* hero: 메인 비주얼 콘텐츠 배치 영역 */}
            <section className="flex h-56 items-center justify-center bg-primary-subtle text-primary">
                Hero 콘텐츠 배치
            </section>

            {/* Container: 좌/우 패딩 + 섹션 간 gap */}
            <div className="flex flex-col gap-6 px-4 py-6">
                {sections.map(({ title, count }) => (
                    <section key={title} className="flex flex-col gap-3 py-2">
                        <h2 className="text-base font-semibold text-foreground">{title}</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {Array.from({ length: count }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex h-28 items-center justify-center rounded-xl bg-muted text-sm text-foreground-tertiary"
                                >
                                    card
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </>
    );
}
