import {
    ArtworkStatus,
    PartnerStatus,
    ProgramStatus,
    ReservationDeliveryMethod,
    ReservationStatus,
    StoreStatus,
    ProgramDifficulty,
    type ArtworkDetail,
    type ConvenienceInfo,
    type DayOfWeek,
    type ReservationDetail,
    type ReservationListItem,
    type ReviewDetail,
    type StoreReviewListItem,
    type ProgramImage,
} from '@todam/shared';

// 인메모리 mock 저장소. prisma 모델 형태를 최소한으로 흉내낸다.
export interface PartnerRow {
    id: string;
    userId: string;
    status: PartnerStatus;
    rejectedReason: string | null;
    approvedAt: string | null;
    createdAt: string;
}
export interface StoreRow {
    id: string;
    partnerId: string;
    name: string;
    slug: string;
    description: string;
    phone: string;
    address: string;
    latitude: number;
    longitude: number;
    convenienceInfo: ConvenienceInfo;
    autoConfirm: boolean;
    status: StoreStatus;
    publishedAt: string | null;
    rejectedReason: string | null;
    createdAt: string;
}
export interface BusinessDocumentRow {
    id: string;
    partnerId: string;
    storeId: string;
    documentUrl: string;
    ownerName: string;
    businessName: string;
    businessNumber: string;
    businessAddress: string;
    email: string;
    verifiedAt: string | null;
}
export interface OperatingHourRow {
    id: string;
    storeId: string;
    dayOfWeek: DayOfWeek;
    openTime: string;
    closeTime: string;
    breakStart: string | null;
    breakEnd: string | null;
}

interface MockDb {
    partners: PartnerRow[];
    stores: StoreRow[];
    businessDocuments: BusinessDocumentRow[];
    operatingHours: OperatingHourRow[];
}

export const db: MockDb = {
    partners: [],
    stores: [],
    businessDocuments: [],
    operatingHours: [],
};

let seq = 0;
export function genId(prefix: string): string {
    seq += 1;
    return `${prefix}-${seq.toString().padStart(4, '0')}`;
}

export function nowIso(): string {
    return new Date().toISOString();
}

// ─── 프로그램 mock DB ────────────────────────────────────────────

export interface ProgramRow {
    id: string;
    storeId: string;
    title: string;
    description: string | null;
    materials: string | null;
    price: number;
    durationMinutes: number;
    leadTimeDays: number;
    difficulty: ProgramDifficulty;
    childFriendly: boolean;
    deliverable: boolean;
    status: ProgramStatus;
    updatedAt: string;
}

export interface ProgramImageRow {
    programImageId: string;
    programId: string;
    imageUrl: string;
    isThumbnail: boolean;
    status: 'PENDING' | 'UPLOADED';
}

// 시드: 테스트용 공방 + 프로그램 데이터
export const MOCK_STORE_ID = 'store-seed-0001';
export const MOCK_STORE_SLUG = 'todam-pottery';
export const MOCK_STORE_NAME = '흙과 사람';

export function findPublicStoreBySlug(slug: string) {
    if (slug !== MOCK_STORE_SLUG) return null;
    return {
        id: MOCK_STORE_ID,
        partnerId: 'partner-seed-0001',
        slug: MOCK_STORE_SLUG,
        name: MOCK_STORE_NAME,
        description: '차분한 분위기에서 도자기 클래스를 운영하는 공방입니다.',
        phone: '02-1234-5678',
        address: '서울특별시 성동구 뚝섬로 273',
        status: StoreStatus.PUBLISHED,
        convenienceInfo: { parking: true, pet: false, wifi: true },
        autoConfirm: false,
        publishedAt: '2026-05-20T09:00:00.000Z',
        images: [
            {
                imageUrl: 'https://placehold.co/640x360?text=store',
            },
        ],
        rating: 4.8,
        reviewCount: SEEDED_STORE_REVIEWS.length,
        location: { lat: 37.5446, lng: 127.056 },
        isFavorite: false,
    };
}

const SEEDED_STORE_REVIEWS: StoreReviewListItem[] = [
    {
        id: 'store-review-001',
        nickname: 'use*********',
        rating: 5,
        content: '처음 물레를 만져봤는데 차근차근 알려주셔서 완성까지 재미있게 했어요.',
        photos: [
            {
                imageUrl: 'https://placehold.co/800x800?text=review-1',
            },
        ],
        programId: 'prog-uuid-001',
        programTitle: '머그컵 만들기',
        createdAt: '2026-05-24T12:00:00.000Z',
    },
    {
        id: 'store-review-002',
        nickname: 'cla*********',
        rating: 5,
        content:
            '공방 분위기가 조용하고 선생님이 친절했어요. 다음에는 다른 클래스도 들어보고 싶어요.',
        photos: [
            {
                imageUrl: 'https://placehold.co/800x800?text=review-2',
            },
            {
                imageUrl: 'https://placehold.co/800x800?text=review-3',
            },
        ],
        programId: 'prog-uuid-002',
        programTitle: '화병 클래스',
        createdAt: '2026-05-23T12:00:00.000Z',
    },
    {
        id: 'store-review-003',
        nickname: 'pot*********',
        rating: 4,
        content: '설명이 명확해서 좋았습니다. 작품 받는 날이 기다려져요.',
        photos: [],
        programId: 'prog-uuid-003',
        programTitle: '핸드빌딩 머그컵 만들기',
        createdAt: '2026-05-21T12:00:00.000Z',
    },
    {
        id: 'store-review-004',
        nickname: 'tod*********',
        rating: 3,
        content: '체험 자체는 좋았고, 주말이라 조금 붐볐어요.',
        photos: [],
        programId: 'prog-uuid-004',
        programTitle: '커플 도자기 클래스',
        createdAt: '2026-05-19T12:00:00.000Z',
    },
];

export function listStoreReviews(
    slug: string,
    cursor: string | null,
    limit: number,
    sort: 'latest' | 'rating_high',
) {
    if (slug !== MOCK_STORE_SLUG) return null;

    const all = [...SEEDED_STORE_REVIEWS].sort((a, b) => {
        if (sort === 'rating_high' && b.rating !== a.rating) return b.rating - a.rating;
        return b.createdAt.localeCompare(a.createdAt);
    });

    let startIdx = 0;
    if (cursor) {
        const idx = all.findIndex((review) => review.id === cursor);
        startIdx = idx >= 0 ? idx + 1 : all.length;
    }

    const window = all.slice(startIdx, startIdx + limit + 1);
    const hasNext = window.length > limit;
    const reviews = window.slice(0, limit);
    const nextCursor = hasNext ? (reviews[reviews.length - 1]?.id ?? null) : null;
    return { reviews, pageInfo: { nextCursor, hasNext } };
}

export const seededPrograms: ProgramRow[] = [
    {
        id: 'prog-uuid-001',
        storeId: MOCK_STORE_ID,
        title: '물레 체험 기초반',
        description: '처음 도자기를 접하는 분들을 위한 물레 체험입니다.',
        materials: '앞치마 (공방 제공), 편한 복장',
        price: 45000,
        durationMinutes: 120,
        leadTimeDays: 30,
        difficulty: ProgramDifficulty.BASIC,
        childFriendly: true,
        deliverable: false,
        status: ProgramStatus.ACTIVE,
        updatedAt: '2026-05-25T19:05:00.000Z',
    },
    // 클래스 목록(storePrograms) 항목들의 상세 데이터 — 목록→상세 진입 시 조회됨.
    {
        id: 'prog-seed-0001',
        storeId: MOCK_STORE_ID,
        title: '도자기 물레 원데이 클래스',
        description: '물레로 그릇을 빚어보는 원데이 클래스입니다.',
        materials: '앞치마 (공방 제공)',
        price: 45000,
        durationMinutes: 120,
        leadTimeDays: 28,
        difficulty: ProgramDifficulty.BASIC,
        childFriendly: true,
        deliverable: true,
        status: ProgramStatus.ACTIVE,
        updatedAt: '2026-05-21T09:00:00.000Z',
    },
    {
        id: 'prog-seed-0002',
        storeId: MOCK_STORE_ID,
        title: '핸드빌딩 머그컵 만들기',
        description: '손으로 빚어 나만의 머그컵을 만듭니다.',
        materials: null,
        price: 38000,
        durationMinutes: 90,
        leadTimeDays: 30,
        difficulty: ProgramDifficulty.INTERMEDIATE,
        childFriendly: false,
        deliverable: false,
        status: ProgramStatus.DRAFT,
        updatedAt: '2026-05-22T09:00:00.000Z',
    },
    {
        id: 'prog-seed-0003',
        storeId: MOCK_STORE_ID,
        title: '커플 도자기 클래스',
        description: '둘이 함께 만드는 도자기 클래스입니다.',
        materials: null,
        price: 88000,
        durationMinutes: 150,
        leadTimeDays: 35,
        difficulty: ProgramDifficulty.ADVANCED,
        childFriendly: false,
        deliverable: true,
        status: ProgramStatus.INACTIVE,
        updatedAt: '2026-05-23T09:00:00.000Z',
    },
];

export const seededProgramImages: ProgramImageRow[] = [
    {
        programImageId: 'prog-img-uuid-001',
        programId: 'prog-uuid-001',
        imageUrl: 'https://cdn.todam.app/programs/prog-uuid-001/01.jpg',
        isThumbnail: true,
        status: 'UPLOADED',
    },
];

export function findProgramBySlugAndId(slug: string, programId: string): ProgramRow | undefined {
    // slug → storeId 매핑 (시드 기준)
    if (slug !== MOCK_STORE_SLUG) return undefined;
    return seededPrograms.find((p) => p.id === programId);
}

export function findProgramByStoreAndId(
    storeId: string,
    programId: string,
): ProgramRow | undefined {
    return seededPrograms.find((p) => p.storeId === storeId && p.id === programId);
}

// programId 단독 조회(퍼블릭 상세·리뷰 — 라우트에 slug 미포함).
export function findProgramById(programId: string): ProgramRow | undefined {
    return seededPrograms.find((p) => p.id === programId);
}

export function getProgramImages(programId: string): ProgramImageRow[] {
    return seededProgramImages.filter((img) => img.programId === programId);
}

export function updateProgram(
    programId: string,
    patch: Partial<Omit<ProgramRow, 'id' | 'storeId'>>,
): ProgramRow | undefined {
    const idx = seededPrograms.findIndex((p) => p.id === programId);
    if (idx === -1) return undefined;
    seededPrograms[idx] = { ...seededPrograms[idx]!, ...patch, updatedAt: nowIso() };
    return seededPrograms[idx]!;
}

// [제거] createProgram/updateProgramStatus/confirmProgramImage mock 헬퍼 — 클래스 등록 실 BE 연동 완료로 불필요.

export function programToApiShape(program: ProgramRow): object {
    const images: ProgramImage[] = getProgramImages(program.id).map((img) => ({
        programImageId: img.programImageId,
        imageUrl: img.imageUrl,
        isThumbnail: img.isThumbnail,
    }));
    return {
        id: program.id,
        storeId: program.storeId,
        storeName: MOCK_STORE_NAME,
        title: program.title,
        description: program.description,
        materials: program.materials,
        caution: null,
        price: program.price,
        durationMinutes: program.durationMinutes,
        capacity: 4,
        leadTimeDays: program.leadTimeDays,
        difficulty: program.difficulty,
        childFriendly: program.childFriendly,
        deliverable: program.deliverable,
        status: program.status,
        images,
    };
}

// 주소 → 좌표 mock. (실연동: 카카오 로컬 API) 서울 도심 기준 deterministic offset.
export function mockGeocode(query: string): { latitude: number; longitude: number } {
    let hash = 0;
    for (let i = 0; i < query.length; i += 1) {
        hash = (hash * 31 + query.charCodeAt(i)) % 100000;
    }
    const latitude = 37.5 + (hash % 1000) / 100000; // 37.5 ~ 37.51
    const longitude = 127.0 + ((hash >> 3) % 1000) / 100000;
    return { latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)) };
}

// ─── 나의 예약 목록 시드 ─────────────────────────────────────────
// 정본 정렬: 최신순 (createdAt 내림차순). cursor 기준은 항목 id(정본 응답대로).
// 8 Reservation status + 4 IN_PROGRESS substate 시각 검증 커버.
// displayState 정본은 plan §Design tokens "displayState 정본 매핑" 표 그대로.
const SEEDED_RESERVATIONS: ReservationListItem[] = [
    {
        id: 'res-seed-0001',
        storeName: '토담 공방',
        programTitle: '머그컵 만들기',
        scheduledAt: '2026-06-18T10:00:00.000Z',
        participantCount: 2,
        status: ReservationStatus.PENDING,
        displayState: {
            label: '예약신청',
            description: '작가님이 예약 내용을 확인하고 있어요.',
            subLabel: null,
        },
        createdAt: '2026-06-01T09:00:00.000Z',
    },
    {
        id: 'res-seed-0002',
        storeName: '서래마을 도예원',
        programTitle: '주말 가족 도자기',
        scheduledAt: '2026-06-12T13:00:00.000Z',
        participantCount: 4,
        status: ReservationStatus.CONFIRMED,
        displayState: {
            label: '예약확정',
            description: '예약이 확정되었어요. 공방에서 곧 만나요!',
            subLabel: null,
        },
        createdAt: '2026-05-31T18:00:00.000Z',
    },
    {
        id: 'res-seed-0003',
        storeName: '플러스 도자기',
        programTitle: '취소된 클래스',
        scheduledAt: '2026-06-10T10:00:00.000Z',
        participantCount: 1,
        status: ReservationStatus.CANCELED,
        displayState: {
            label: '예약취소',
            description: '아쉽지만 예약이 취소되었어요. 다음에 꼭 다시 만나요.',
            subLabel: null,
        },
        createdAt: '2026-05-30T16:30:00.000Z',
    },
    {
        id: 'res-seed-0004',
        storeName: '흙과 사람',
        programTitle: '물레 체험 기초반',
        scheduledAt: '2026-06-15T14:00:00.000Z',
        participantCount: 1,
        status: ReservationStatus.IN_PROGRESS,
        displayState: {
            label: '제작 중',
            description: '작품이 단단해지도록 정성껏 말리고 있어요.',
            subLabel: '건조',
        },
        createdAt: '2026-05-30T11:20:00.000Z',
    },
    {
        id: 'res-seed-0005',
        storeName: '클레이 서울',
        programTitle: '체험 한바탕',
        scheduledAt: '2026-06-08T11:00:00.000Z',
        participantCount: 2,
        status: ReservationStatus.IN_PROGRESS,
        displayState: {
            label: '제작 중',
            description: '가마 속에서 첫 번째로 구워지는 중이에요.',
            subLabel: '초벌',
        },
        createdAt: '2026-05-28T15:00:00.000Z',
    },
    {
        id: 'res-seed-0006',
        storeName: '토담 공방',
        programTitle: '핸드 빌딩 클래스',
        scheduledAt: '2026-05-15T15:00:00.000Z',
        participantCount: 1,
        status: ReservationStatus.IN_PROGRESS,
        displayState: {
            label: '제작 중',
            description: '매끄러운 빛깔을 내기 위해 예쁘게 옷을 입혔어요.',
            subLabel: '유약',
        },
        createdAt: '2026-05-26T09:30:00.000Z',
    },
    {
        id: 'res-seed-0007',
        storeName: '백자방',
        programTitle: '화병 만들기',
        scheduledAt: '2026-05-10T11:00:00.000Z',
        participantCount: 2,
        status: ReservationStatus.IN_PROGRESS,
        displayState: {
            label: '제작 중',
            description: '가장 뜨거운 가마를 견디며 더 튼튼해지고 있어요.',
            subLabel: '재벌',
        },
        createdAt: '2026-05-25T14:00:00.000Z',
    },
    {
        id: 'res-seed-0008',
        storeName: '클레이 서울',
        programTitle: '도자기 페인팅 클래스',
        scheduledAt: '2026-06-05T16:00:00.000Z',
        participantCount: 3,
        status: ReservationStatus.SHIPPED,
        displayState: {
            label: '배송 중',
            description: '소중한 작품을 꼼꼼히 포장해서 보냈어요.',
            subLabel: null,
        },
        createdAt: '2026-05-23T13:45:00.000Z',
    },
    {
        id: 'res-seed-0009',
        storeName: '플러스 도자기',
        programTitle: '접시 만들기 원데이',
        scheduledAt: '2026-05-20T11:00:00.000Z',
        participantCount: 2,
        status: ReservationStatus.DELIVERED,
        // DELIVERED 는 status message UI 숨김 → description 공백.
        displayState: {
            label: '작품 도착',
            description: '',
            subLabel: null,
        },
        createdAt: '2026-05-18T10:00:00.000Z',
    },
    {
        id: 'res-seed-0010',
        storeName: '온도 스튜디오',
        programTitle: '오브제 만들기',
        scheduledAt: '2026-05-12T13:00:00.000Z',
        participantCount: 1,
        status: ReservationStatus.PICKUP_READY,
        displayState: {
            label: '픽업 가능',
            description: '작품이 완성되어 공방에서 기다리고 있어요.',
            subLabel: null,
        },
        createdAt: '2026-05-15T11:00:00.000Z',
    },
    {
        id: 'res-seed-0011',
        storeName: '흙과 사람',
        programTitle: '캔들 홀더 만들기',
        scheduledAt: '2026-04-22T10:00:00.000Z',
        participantCount: 1,
        status: ReservationStatus.PICKUP_DONE,
        displayState: {
            label: '픽업 완료',
            description: '',
            subLabel: null,
        },
        createdAt: '2026-04-25T16:20:00.000Z',
    },
];

// 본인 예약 목록 반환(이미 createdAt 내림차순으로 시드됨).
// status 필터링은 핸들러에서 적용.
export function listMyReservations(): ReservationListItem[] {
    return SEEDED_RESERVATIONS;
}

// ─── 예약 상세 seed ──────────────────────────────────────────────
// Figma 4 변형(체험 전 / 체험 완료-리뷰 전 / 체험 완료-리뷰 후 / 취소 dialog) 데이터.
// 목록 시드 id 재사용(res-seed-0002 = CONFIRMED, res-seed-0004 = IN_PROGRESS, res-seed-0008 = SHIPPED).
// 추가 시드(res-seed-0101 = SHIPPED + 리뷰 작성됨)로 변형 C 커버.
//
// 디자인 정본: 머그컵 만들기 · 흙과 사람 (성수동) · 2026.04.18 (토) 15:00 · 2명 · 90,000원 · 택배.
const SEEDED_RESERVATION_DETAILS: Record<string, ReservationDetail> = {
    // 변형 A — 체험 전 (CONFIRMED + 배송 입력됨 + 다음 단계 안내). cancelable.
    // 본 시드는 "배송 정보 수정 — 입력됨 케이스" 흐름의 prefill 검증용으로 delivery 5필드를 채움.
    'res-seed-0002': {
        id: 'res-seed-0002',
        storeId: 'store-seed-0050',
        storeName: '흙과 사람',
        programId: 'prog-seed-0050',
        programTitle: '머그컵 만들기',
        scheduledAt: '2026-04-18T15:00:00.000Z',
        reserverName: '김리듬',
        reserverPhone: '010-0000-0000',
        participantCount: 2,
        deliveryMethod: ReservationDeliveryMethod.DELIVERY,
        shippingAddress: '서울특별시 마포구 월드컵북로 12',
        requestMemo: null,
        status: ReservationStatus.CONFIRMED,
        displayState: {
            label: '예약확정',
            description: '예약이 확정되었어요. 공방에서 곧 만나요!',
            subLabel: null,
        },
        artworkId: null,
        createdAt: '2026-05-31T18:00:00.000Z',
        totalPrice: 90000,
        delivery: {
            recipientName: '김리듬',
            recipientPhone: '010-9876-5432',
            address: '서울특별시 마포구 월드컵북로 12',
            carrier: null,
            trackingNumber: null,
        },
        canCancel: true,
        cancelDeadlineDays: 3,
        artwork: null,
        hasReview: false,
        reviewId: null,
    },

    // 변형 B — 체험 완료 / 리뷰 전 (IN_PROGRESS 건조 + 배송 입력됨 / 운송장 미발송 + 리뷰 빈).
    'res-seed-0004': {
        id: 'res-seed-0004',
        storeId: 'store-seed-0050',
        storeName: '흙과 사람',
        programId: 'prog-seed-0050',
        programTitle: '머그컵 만들기',
        scheduledAt: '2026-04-18T15:00:00.000Z',
        reserverName: '김리듬',
        reserverPhone: '010-0000-0000',
        participantCount: 2,
        deliveryMethod: ReservationDeliveryMethod.DELIVERY,
        shippingAddress: '서울특별시 성동구 성수이로 12길 34',
        requestMemo: null,
        status: ReservationStatus.IN_PROGRESS,
        displayState: {
            label: '제작 중',
            description: '작품이 단단해지도록 정성껏 말리고 있어요.',
            subLabel: '건조',
        },
        artworkId: 'artwork-seed-0004',
        createdAt: '2026-05-30T11:20:00.000Z',
        totalPrice: 90000,
        delivery: {
            recipientName: '김리듬',
            recipientPhone: '010-0000-0000',
            address: '서울특별시 성동구 성수이로 12길 34',
            carrier: null,
            trackingNumber: null,
        },
        canCancel: false,
        cancelDeadlineDays: 3,
        artwork: {
            id: 'artwork-seed-0004',
            progressPercent: 25,
            remainingSteps: 3,
        },
        hasReview: false,
        reviewId: null,
    },

    // 변형 C — 체험 완료 / 리뷰 작성됨 (SHIPPED + 운송장 발송 + 리뷰 있음).
    'res-seed-0008': {
        id: 'res-seed-0008',
        storeId: 'store-seed-0050',
        storeName: '흙과 사람',
        programId: 'prog-seed-0050',
        programTitle: '머그컵 만들기',
        scheduledAt: '2026-04-18T15:00:00.000Z',
        reserverName: '김리듬',
        reserverPhone: '010-0000-0000',
        participantCount: 2,
        deliveryMethod: ReservationDeliveryMethod.DELIVERY,
        shippingAddress: '서울특별시 성동구 성수이로 12길 34',
        requestMemo: null,
        status: ReservationStatus.SHIPPED,
        displayState: {
            label: '배송 중',
            description: '소중한 작품을 꼼꼼히 포장해서 보냈어요.',
            subLabel: null,
        },
        artworkId: 'artwork-seed-0008',
        createdAt: '2026-05-23T13:45:00.000Z',
        totalPrice: 90000,
        delivery: {
            recipientName: '김리듬',
            recipientPhone: '010-0000-0000',
            address: '서울특별시 성동구 성수이로 12길 34',
            carrier: '우체국 택배',
            trackingNumber: '1111222233334',
        },
        canCancel: false,
        cancelDeadlineDays: null,
        artwork: null,
        hasReview: true,
        reviewId: 'review-seed-0008',
    },

    // 변형 D 보조 — 취소 불가 dialog 검증용 (PENDING + canCancel false).
    'res-seed-0001': {
        id: 'res-seed-0001',
        storeId: 'store-seed-0001',
        storeName: '토담 공방',
        programId: 'prog-seed-0001',
        programTitle: '머그컵 만들기',
        scheduledAt: '2026-06-18T10:00:00.000Z',
        reserverName: '김리듬',
        reserverPhone: '010-0000-0000',
        participantCount: 2,
        deliveryMethod: ReservationDeliveryMethod.DELIVERY,
        shippingAddress: null,
        requestMemo: null,
        status: ReservationStatus.PENDING,
        displayState: {
            label: '예약신청',
            description: '작가님이 예약 내용을 확인하고 있어요.',
            subLabel: null,
        },
        artworkId: null,
        createdAt: '2026-06-01T09:00:00.000Z',
        totalPrice: 90000,
        delivery: null,
        canCancel: false, // 취소 시한 지남 — 불가 dialog 시뮬레이션.
        cancelDeadlineDays: 3,
        artwork: null,
        hasReview: false,
        reviewId: null,
    },
};

// 리뷰 상세 seed (D4 가정 endpoint).
const SEEDED_REVIEW_DETAILS: Record<string, ReviewDetail> = {
    'res-seed-0008': {
        id: 'review-seed-0008',
        reservationId: 'res-seed-0008',
        rating: 5,
        content: '체험 정말 즐거웠어요. 작가님 친절하시고 머그컵도 만족스러워요!',
        photos: [{ id: 'photo-seed-0008-1', imageUrl: 'https://placehold.co/56x56?text=IMG' }],
        createdAt: '2026-05-25T10:00:00.000Z',
    },
};

export function findReservationDetail(id: string): ReservationDetail | undefined {
    return SEEDED_RESERVATION_DETAILS[id];
}

// ─── 배송 정보 in-memory 저장소 (PATCH /reservations/:id/delivery) ──────
// 본 endpoint 응답은 5필드(recipientName/recipientPhone/postalCode/address/addressDetail)지만
// 예약 상세 응답의 delivery 는 5필드 중 postalCode/addressDetail 없는 다른 shape(+carrier/trackingNumber).
// 두 shape 합치지 않고 별도 저장 — 본 store 는 PATCH 응답 echo + 예약 상세 5필드 부분 머지.
type DeliveryEditRecord = {
    recipientName: string;
    recipientPhone: string;
    postalCode: string;
    address: string;
    addressDetail?: string;
};
const deliveryEdits: Record<string, DeliveryEditRecord> = {};

export function upsertDeliveryEdit(
    reservationId: string,
    record: DeliveryEditRecord,
): DeliveryEditRecord {
    deliveryEdits[reservationId] = record;
    // 예약 상세 시드의 delivery 객체에 5필드 중 reservation-detail contract 가 갖는 부분만 미러링.
    // (carrier/trackingNumber 는 본 endpoint 비책임 — 기존 값 보존)
    const reservation = SEEDED_RESERVATION_DETAILS[reservationId];
    if (reservation) {
        const prev = reservation.delivery;
        reservation.delivery = {
            recipientName: record.recipientName,
            recipientPhone: record.recipientPhone,
            address: record.address,
            carrier: prev?.carrier ?? null,
            trackingNumber: prev?.trackingNumber ?? null,
        };
        reservation.shippingAddress = record.address;
    }
    return record;
}

export function findReviewByReservation(reservationId: string): ReviewDetail | undefined {
    return SEEDED_REVIEW_DETAILS[reservationId];
}

export function findReviewById(reviewId: string): ReviewDetail | undefined {
    return Object.values(SEEDED_REVIEW_DETAILS).find((r) => r.id === reviewId);
}

// S3 Key → 노출 URL (mock). presigned 업로드된 사진의 표시용 URL 구성.
function reviewPhotoKeyToUrl(key: string): string {
    return `https://todam-bucket.s3.ap-northeast-2.amazonaws.com/${key}`;
}

interface ReviewWriteInput {
    rating: number;
    content?: string;
    photos?: string[];
}

// 리뷰 작성 — SEEDED_REVIEW_DETAILS 갱신 + 예약 detail hasReview 전이.
export function createReview(reservationId: string, input: ReviewWriteInput): ReviewDetail {
    const id = genId('review');
    const review: ReviewDetail = {
        id,
        reservationId,
        rating: input.rating,
        content: input.content ?? '',
        photos: (input.photos ?? []).map((key, i) => ({
            id: `${id}-p${i + 1}`,
            imageUrl: reviewPhotoKeyToUrl(key),
        })),
        createdAt: nowIso(),
    };
    SEEDED_REVIEW_DETAILS[reservationId] = review;
    const detail = SEEDED_RESERVATION_DETAILS[reservationId];
    if (detail) {
        detail.hasReview = true;
        detail.reviewId = id;
    }
    return review;
}

// 리뷰 수정 — 기존 photos 통째 교체. 미존재 시 undefined.
export function updateReview(reviewId: string, input: ReviewWriteInput): ReviewDetail | undefined {
    const review = findReviewById(reviewId);
    if (!review) return undefined;
    review.rating = input.rating;
    review.content = input.content ?? '';
    if (input.photos) {
        review.photos = input.photos.map((key, i) => ({
            id: `${review.id}-p${i + 1}`,
            imageUrl: reviewPhotoKeyToUrl(key),
        }));
    }
    return review;
}

// 리뷰 사진 presigned (D14 — 추론 mock). 응답에 S3 key 포함.
export function createReviewImageUpload(fileName: string): { uploadUrl: string; key: string } {
    const id = genId('rphoto');
    const key = `reviews/photos/${id}_${fileName}`;
    return {
        uploadUrl: `https://todam-bucket.s3.ap-northeast-2.amazonaws.com/${key}?mock=1`,
        key,
    };
}

// ─── 작품 상세 seed (GET /artworks/{artworkId}) ───────────────────────
// plan: docs/exec-plans/active/유저 예약 - 작품 상세 조회.md
// - reservation seed 의 artworkId 와 매핑 (res-seed-0004 ↔ artwork-seed-0004 등).
// - displayState 는 plan §displayState 단계 매핑 표 SSOT 그대로(추측 금지).
//   IN_PROGRESS substate(DRYING/BISQUE_FIRING/GLAZING/GLAZE_FIRING) +
//   VISITED("체험이 완료되었어요.") + COMPLETED("작품이 완성되었어요.").
//   ⚠️ RESERVED 는 plan D5 미해소 → timeline 에 등장시키지 않음.
// - D1: imageUrl(원본)만 제공. 리사이징은 next/image 위임.
const ARTWORK_SEED_IMG = (slug: string) =>
    `https://placehold.co/320x320?text=${encodeURIComponent(slug)}`;

const SEEDED_ARTWORK_DETAILS: Record<string, ArtworkDetail> = {
    // 변형 B (예약 상세 res-seed-0004 = IN_PROGRESS 건조) 와 연결.
    // 단계 예시: VISITED(완료) + DRYING(현재) + BISQUE_FIRING/GLAZING/GLAZE_FIRING/COMPLETED(미완료).
    'artwork-seed-0004': {
        id: 'artwork-seed-0004',
        estimatedCompletedAt: '2026-07-01T00:00:00.000Z',
        currentStage: {
            status: ArtworkStatus.DRYING,
            displayState: {
                label: '제작 중',
                description: '작품이 단단해지도록 정성껏 말리고 있어요.',
                subLabel: '건조',
            },
        },
        timeline: [
            {
                stage: ArtworkStatus.VISITED,
                isCompleted: true,
                displayState: {
                    label: '흙',
                    description: '체험이 완료되었어요.',
                    subLabel: null,
                },
                photos: [],
                completedAt: '2026-04-03T12:30:00.000Z',
            },
            {
                stage: ArtworkStatus.DRYING,
                isCompleted: false,
                isCurrent: true,
                displayState: {
                    label: '제작 중',
                    description: '작품이 단단해지도록 정성껏 말리고 있어요.',
                    subLabel: '건조',
                },
                photos: [
                    {
                        imageUrl: ARTWORK_SEED_IMG('drying-1'),
                    },
                    {
                        imageUrl: ARTWORK_SEED_IMG('drying-2'),
                    },
                ],
            },
            {
                stage: ArtworkStatus.BISQUE_FIRING,
                isCompleted: false,
                displayState: {
                    label: '제작 중',
                    description: '가마 속에서 첫 번째로 구워지는 중이에요.',
                    subLabel: '초벌',
                },
                photos: [],
            },
            {
                stage: ArtworkStatus.GLAZING,
                isCompleted: false,
                displayState: {
                    label: '제작 중',
                    description: '매끄러운 빛깔을 내기 위해 예쁘게 옷을 입혔어요.',
                    subLabel: '유약',
                },
                photos: [],
            },
            {
                stage: ArtworkStatus.GLAZE_FIRING,
                isCompleted: false,
                displayState: {
                    label: '제작 중',
                    description: '가장 뜨거운 가마를 견디며 더 튼튼해지고 있어요.',
                    subLabel: '재벌',
                },
                photos: [],
            },
            {
                stage: ArtworkStatus.COMPLETED,
                isCompleted: false,
                displayState: {
                    label: '완성',
                    description: '작품이 완성되었어요.',
                    subLabel: null,
                },
                photos: [],
            },
        ],
    },

    // 추가 시드: 다수의 완료 단계 + 단계별 사진 검증용.
    // Figma `8505:15922` 정본 stepper 예시(체험→건조→초벌→유약(current)→재벌→완성).
    'artwork-seed-figma': {
        id: 'artwork-seed-figma',
        estimatedCompletedAt: '2026-07-01T00:00:00.000Z',
        currentStage: {
            status: ArtworkStatus.GLAZING,
            displayState: {
                label: '제작 중',
                description: '매끄러운 빛깔을 내기 위해 예쁘게 옷을 입혔어요.',
                subLabel: '유약',
            },
        },
        timeline: [
            {
                stage: ArtworkStatus.VISITED,
                isCompleted: true,
                displayState: {
                    label: '흙',
                    description: '체험이 완료되었어요.',
                    subLabel: null,
                },
                photos: [],
                completedAt: '2026-04-03T12:30:00.000Z',
            },
            {
                stage: ArtworkStatus.DRYING,
                isCompleted: true,
                displayState: {
                    label: '제작 중',
                    description: '작품이 단단해지도록 정성껏 말리고 있어요.',
                    subLabel: '건조',
                },
                photos: [
                    {
                        imageUrl: ARTWORK_SEED_IMG('drying-1'),
                    },
                ],
                completedAt: '2026-04-05T15:00:00.000Z',
            },
            {
                stage: ArtworkStatus.BISQUE_FIRING,
                isCompleted: true,
                displayState: {
                    label: '제작 중',
                    description: '가마 속에서 첫 번째로 구워지는 중이에요.',
                    subLabel: '초벌',
                },
                photos: [
                    {
                        imageUrl: ARTWORK_SEED_IMG('bisque-1'),
                    },
                    {
                        imageUrl: ARTWORK_SEED_IMG('bisque-2'),
                    },
                ],
                completedAt: '2026-04-20T11:00:00.000Z',
            },
            {
                stage: ArtworkStatus.GLAZING,
                isCompleted: false,
                isCurrent: true,
                displayState: {
                    label: '제작 중',
                    description: '매끄러운 빛깔을 내기 위해 예쁘게 옷을 입혔어요.',
                    subLabel: '유약',
                },
                photos: [
                    {
                        imageUrl: ARTWORK_SEED_IMG('glazing-1'),
                    },
                    {
                        imageUrl: ARTWORK_SEED_IMG('glazing-2'),
                    },
                    {
                        imageUrl: ARTWORK_SEED_IMG('glazing-3'),
                    },
                ],
            },
            {
                stage: ArtworkStatus.GLAZE_FIRING,
                isCompleted: false,
                displayState: {
                    label: '제작 중',
                    description: '가장 뜨거운 가마를 견디며 더 튼튼해지고 있어요.',
                    subLabel: '재벌',
                },
                photos: [],
            },
            {
                stage: ArtworkStatus.COMPLETED,
                isCompleted: false,
                displayState: {
                    label: '완성',
                    description: '작품이 완성되었어요.',
                    subLabel: null,
                },
                photos: [],
            },
        ],
    },
};

export function findArtworkDetail(id: string): ArtworkDetail | undefined {
    return SEEDED_ARTWORK_DETAILS[id];
}
