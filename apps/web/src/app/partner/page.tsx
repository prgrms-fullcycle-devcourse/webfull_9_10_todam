const sections = [
    { title: '대기 중인 예약', count: 4 },
    { title: '오늘의 일정', count: 4 },
    { title: '제작 중인 작품', count: 4 },
];

export default function PartnerHomePage() {
    // 검수중/반려 영속 분기 + 무파트너 /apply 리다이렉트는 루트 AppShell(온보딩 게이트)이 처리.
    // 이 페이지가 렌더되면 partner 는 APPROVED 상태.
    return (
        <>
            <main className="flex-1 overflow-y-auto">
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
            </main>
        </>
    );
}
