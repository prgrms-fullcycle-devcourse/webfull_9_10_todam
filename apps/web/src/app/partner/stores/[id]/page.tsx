'use client';

import { use } from 'react';
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
import { PartnerClassListItem } from '@/features/program/list';
import { ApiError } from '@/shared/api';
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
// 디자인: 평점 행 gap 4px 안에서 "・" 구분자 2개(문의 앞 / 문의·공유 사이)와 함께 정렬.
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
    // tel: 스킴은 하이픈 허용하나 일부 다이얼러 호환 위해 숫자·+ 만 남김.
    const telHref = `tel:${phone.replace(/[^0-9+]/g, '')}`;

    // PWA·모바일: Web Share API(OS 공유 시트). 미지원(데스크탑 일부)·실패: 링크 클립보드 복사 fallback.
    async function handleShare() {
        const url = `${window.location.origin}/stores/${slug}`;
        if (typeof navigator.share === 'function') {
            try {
                await navigator.share({ title: storeName, url });
                return;
            } catch (e) {
                // 사용자 취소(AbortError)는 조용히 종료. 그 외 오류는 복사 fallback 으로.
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

export default function PartnerStoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { open } = useSheet();

    const detail = usePartnerStoreDetail(id);
    const programs = usePartnerStorePrograms(id);

    // 전역 Header override: 뒤로가기(→공방 관리) + 타이틀. 우측 액션 없음.
    // 심사중·반려는 검수 결과 화면(헤더 없음)이므로 override 비활성.
    const detailStatus = detail.data?.store.status;
    const isReviewScreen =
        detailStatus === StoreStatus.PENDING || detailStatus === StoreStatus.REJECTED;
    useHeaderOverride({
        title: '공방 미리보기',
        onBack: () => router.push('/partner/stores'),
        hideRightAction: true,
        enabled: !isReviewScreen,
    });

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

    // 심사중·반려 공방은 일반 상세 대신 검수 결과 화면. (심사 결과 = 스토어 단위 store.status)
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
                onEditInfo={() => router.push(`/partner/stores/${id}/business`)}
                onBack={() => router.push('/partner/stores')}
            />
        );
    }

    const programList = programs.data?.programs ?? [];
    const hasPrograms = programList.length > 0;
    // day는 program 필드가 아니라 store.operatingHours에서 도출(한글 요일 "·" join). 모든 클래스 공통.

    return (
        <div className="flex h-full flex-col bg-background">
            <main className="flex-1 overflow-y-auto pb-28">
                {/* 대표 이미지 carousel */}
                <StoreImageCarousel images={store.images} />

                <div className="flex flex-col px-4">
                    <SpaceBlock size={8} />

                    {/* 기본 정보: 편의 태그 / 공방명 / 상태 배지 / 평점 / 리뷰 수 / 문의·공유 / 소개. 찜 버튼 미노출. */}
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

                    {/* 운영 중인 클래스. 진행 중 예약 건수는 수정 바텀시트 헤더로 이동(별도 섹션 제거). */}
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
                        {/* 등록된 클래스 없음 → 안내 + 클래스 관리 진입 (관리 페이지서 등록·순서변경) */}
                        {!programs.isLoading && !programs.isError && !hasPrograms && (
                            <div className="flex flex-col gap-3">
                                <DescriptionBlock title="공방 안내">
                                    아직 등록된 클래스가 없어요. 첫 클래스를 등록해보세요.
                                </DescriptionBlock>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => router.push(`/partner/classes?storeId=${id}`)}
                                >
                                    클래스 관리
                                </Button>
                            </div>
                        )}
                        {/* 클래스 있음 → 목록 + 하단 클래스 관리 진입 (현재 공방 스코프) */}
                        {!programs.isLoading && !programs.isError && hasPrograms && (
                            <div className="flex flex-col gap-2">
                                {programList.map((program) => (
                                    <PartnerClassListItem key={program.id} program={program} />
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-1 w-full"
                                    onClick={() => router.push(`/partner/classes?storeId=${id}`)}
                                >
                                    클래스 관리
                                </Button>
                            </div>
                        )}
                    </section>

                    <Divider />

                    {/* 위치 — 지도 placeholder + 주소 (실 지도 SDK 연동은 follow-up) */}
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

            {/* 공방 정보 수정하기 → 수정 항목 선택 바텀시트 (하단 고정 BottomBar) */}
            <BottomBar>
                <Button
                    variant="filled"
                    size="lg"
                    className="w-full"
                    onClick={() =>
                        open(
                            <StoreEditSheet
                                storeId={id}
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
