'use client';

import { useRouter } from 'next/navigation';

import {
    BottomBar,
    Button,
    DescriptionBlock,
    Divider,
    PhoneIcon,
    SectionTitle,
    ShareIcon,
    SpaceBlock,
} from '@todam/ui';

import { StoreStatus } from '@todam/shared';

import {
    StoreEditSheet,
    StoreReviewResult,
    usePartnerStoreDetail,
    usePartnerStorePrograms,
} from '@/features/store/detail';
import {
    ConvenienceChips,
    StoreImageCarousel,
    StoreInfoSummary,
    StoreLocation,
} from '@/entities/store';
import { useReviewStore } from '@/entities/store';
import { PartnerClassListItem } from '@/features/program/list';
import { ApiError } from '@/shared/api';
import { useCurrentStoreId } from '@/shared/lib/useCurrentStoreId';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useSheet, useToast } from '@/shared/model';
import { EmptyState } from '@/shared/ui';

// 에러 코드 → 안내 문구. 401/403/404/500 분기.
function errorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        switch (error.statusCode) {
            case 401:
                return '로그인이 필요합니다. 다시 로그인해주세요.';
            case 403:
                return '해당 공방에 대한 접근 권한이 없습니다.';
            case 404:
                return '공방을 찾을 수 없습니다.';
            default:
                return '공방 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
        }
    }
    return '공방 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
}

// 평점 행 우측 액션(문의하기/공유하기). 아이콘 + 라벨만 배치.
// 문의하기 = 공방 전화번호로 tel: 다이얼. 공유하기 = 고객용 공개 페이지(/stores/{slug}) 링크 공유.
function StoreInfoActions({
    phone,
    slug,
    storeName,
}: {
    phone: string;
    slug: string;
    storeName: string;
}) {
    const { push } = useToast();
    const telHref = `tel:${phone.replace(/[^0-9+]/g, '')}`;

    async function handleShare() {
        const url = `${window.location.origin}/stores/${slug}`;
        if (typeof navigator.share === 'function') {
            try {
                await navigator.share({ title: storeName, url });
                return;
            } catch (e) {
                if (e instanceof Error && e.name === 'AbortError') return;
            }
        }
        try {
            await navigator.clipboard.writeText(url);
            push({ message: '공방 링크를 복사했어요.' });
        } catch {
            push({ message: '링크 복사에 실패했어요.' });
        }
    }

    return (
        <>
            <span className="text-foreground-tertiary">・</span>
            <a
                href={telHref}
                className="inline-flex items-center gap-1 text-xs font-medium text-foreground-tertiary hover:text-foreground"
            >
                <PhoneIcon size={16} />
                <span>문의하기</span>
            </a>
            <span className="text-foreground-tertiary">・</span>
            <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-foreground-tertiary hover:text-foreground"
                onClick={handleShare}
            >
                <ShareIcon size={16} />
                <span>공유하기</span>
            </button>
        </>
    );
}

/**
 * 현재 공방 상세 — storeId는 전역 currentStore(useCurrentStoreId). URL 파라미터 없음.
 * 진입: 파트너홈 전환시트(심사중·반려) / 설정 > 공방관리(게시중).
 * 상태별: 심사중·반려 → 검수 결과 화면, 게시중 → 일반 상세.
 */
export default function PartnerStorePage() {
    const router = useRouter();
    const { open } = useSheet();
    const currentStoreId = useCurrentStoreId();
    const { reviewStoreId, setReviewStoreId } = useReviewStore();
    // 미승인 공방 "보기"(reviewStoreId) 우선, 없으면 현재 작업 공방(currentStore).
    // reviewStoreId는 진입점이 명시 설정(심사중 선택=id, 설정>공방관리=null). 언마운트 clear는
    // StrictMode(dev) mount 시 cleanup이 먼저 돌아 값을 날리므로 쓰지 않는다.
    const storeId = reviewStoreId ?? currentStoreId;

    const detail = usePartnerStoreDetail(storeId);
    const programs = usePartnerStorePrograms(storeId);

    const detailStatus = detail.data?.store.status;
    // 헤더 없는 전체 안내 화면(검수 결과·게시중단) → override 비활성 → 헤더 숨김.
    const isReviewScreen =
        detailStatus === StoreStatus.PENDING ||
        detailStatus === StoreStatus.REJECTED ||
        detailStatus === StoreStatus.SUSPENDED;
    const goHome = () => {
        setReviewStoreId(null);
        router.push('/partner');
    };
    useHeaderOverride({
        title: '공방 미리보기',
        onBack: goHome,
        hideRightAction: true,
        enabled: !isReviewScreen,
    });

    // storeId 미확정(bootstrap 전)엔 렌더 보류.
    if (!storeId) return null;

    if (detail.isLoading) {
        return (
            <div className="flex h-full flex-col bg-background">
                <main className="flex-1 overflow-y-auto">
                    <p className="py-10 text-center text-sm text-foreground-tertiary">
                        공방 정보를 불러오는 중입니다.
                    </p>
                </main>
            </div>
        );
    }

    if (detail.isError || !detail.data) {
        return (
            <div className="flex h-full flex-col bg-background">
                <main className="flex-1 overflow-y-auto px-4">
                    <EmptyState message={errorMessage(detail.error)} />
                </main>
            </div>
        );
    }

    const store = detail.data.store;

    // 심사중·반려 공방은 일반 상세 대신 검수 결과 화면.
    if (store.status === StoreStatus.PENDING || store.status === StoreStatus.REJECTED) {
        return (
            <StoreReviewResult
                storeName={store.name}
                status={store.status}
                rejectedReason={store.rejectedReason}
                address={store.address}
                businessNumber={store.businessDocument?.businessNumber}
                email={store.businessDocument?.email}
                createdAt={store.createdAt}
                onEditInfo={() => router.push(`/partner/studio/${storeId}/business`)}
                onBack={goHome}
            />
        );
    }

    // 게시중단 공방 보기 = 중단 안내(탈출 가능 — 홈으로). 작업 공방 lockout(SuspendedStoreGate)과 별개.
    if (store.status === StoreStatus.SUSPENDED) {
        return (
            <div className="flex h-full flex-col bg-background">
                <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
                    <p className="text-base font-semibold text-foreground">
                        이용이 중단되었습니다.
                    </p>
                    <p className="text-sm text-foreground-secondary">고객센터로 문의해주세요.</p>
                    <a
                        href="mailto:support.todam@gmail.com"
                        className="text-sm font-medium text-primary"
                    >
                        support.todam@gmail.com
                    </a>
                </main>
                <BottomBar>
                    <Button className="w-full" onClick={goHome}>
                        홈으로
                    </Button>
                </BottomBar>
            </div>
        );
    }

    const programList = programs.data?.programs ?? [];
    const hasPrograms = programList.length > 0;

    return (
        <div className="flex h-full flex-col bg-background">
            <main className="flex-1 overflow-y-auto pb-28">
                <StoreImageCarousel images={store.images} />

                <div className="flex flex-col px-4">
                    <SpaceBlock size={8} />

                    <div className="py-2">
                        <StoreInfoSummary
                            name={store.name}
                            rating={store.rating}
                            reviewCount={store.reviewCount}
                            description={store.description ?? ''}
                            tags={<ConvenienceChips convenienceInfo={store.convenienceInfo} />}
                            actions={
                                <StoreInfoActions
                                    phone={store.phone}
                                    slug={store.slug}
                                    storeName={store.name}
                                />
                            }
                        />
                    </div>

                    <Divider />

                    <SectionTitle
                        title="운영 클래스"
                        size="lg"
                        subText={hasPrograms ? `${programList.length}개` : '준비 중'}
                    />
                    <section className="py-2">
                        {programs.isLoading && (
                            <p className="py-6 text-center text-sm text-foreground-tertiary">
                                클래스를 불러오는 중입니다.
                            </p>
                        )}
                        {!programs.isLoading && programs.isError && (
                            <p className="py-6 text-center text-sm text-foreground-tertiary">
                                클래스 목록을 불러오지 못했습니다.
                            </p>
                        )}
                        {!programs.isLoading && !programs.isError && !hasPrograms && (
                            <div className="flex flex-col gap-3">
                                <DescriptionBlock title="공방 안내">
                                    아직 등록된 클래스가 없어요. 첫 클래스를 등록해보세요.
                                </DescriptionBlock>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => router.push('/partner/classes')}
                                >
                                    클래스 관리
                                </Button>
                            </div>
                        )}
                        {!programs.isLoading && !programs.isError && hasPrograms && (
                            <div className="flex flex-col gap-2">
                                {programList.map((program) => (
                                    <PartnerClassListItem key={program.id} program={program} />
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-1 w-full"
                                    onClick={() => router.push('/partner/classes')}
                                >
                                    클래스 관리
                                </Button>
                            </div>
                        )}
                    </section>

                    <Divider />

                    <SectionTitle title="위치" size="lg" />
                    <section className="py-2">
                        <StoreLocation
                            address={store.address}
                            latitude={store.latitude}
                            longitude={store.longitude}
                            name={store.name}
                        />
                    </section>
                </div>
            </main>

            <BottomBar>
                <Button
                    variant="filled"
                    size="lg"
                    className="w-full"
                    onClick={() =>
                        open(
                            <StoreEditSheet
                                storeId={storeId}
                                storeName={store.name}
                                inProgressReservationCount={store.inProgressReservationCount}
                            />,
                        )
                    }
                >
                    공방 정보 수정하기
                </Button>
            </BottomBar>
        </div>
    );
}
