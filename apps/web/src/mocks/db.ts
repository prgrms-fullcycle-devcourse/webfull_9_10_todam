import {
    OcrStatus,
    PartnerStatus,
    ReservationStatus,
    StoreStatus,
    type ConvenienceInfo,
    type DayOfWeek,
    type ReservationListItem,
    type StoreRegistrationSubmitRequest,
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
    ocrStatus: OcrStatus;
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

// 현재 로그인 사용자 (mock 고정).
export const MOCK_USER_ID = 'mock-user-0001';

// 시드: 중복 케이스 테스트용.
export const SEEDED_REGISTERED_BUSINESS_NUMBERS = new Set(['123-45-67890']);
export const SEEDED_TAKEN_SLUGS = new Set(['todam', 'ceramic-studio']);

export const db: MockDb = {
    partners: [],
    stores: [],
    businessDocuments: [],
    operatingHours: [],
};

// 찜한 공방 storeId 집합 (mock). 시드 2개.
export const likedStores = new Set<string>(['1', '2']);

export function setLike(storeId: string, liked: boolean): boolean {
    if (liked) likedStores.add(storeId);
    else likedStores.delete(storeId);
    return likedStores.has(storeId);
}

// ─── 내 공방 목록 시드 ──────────────────────────────────────────
// 온보딩 흐름(db.stores)과 분리한 데모 데이터. 최신 생성순 정렬을 위해 createdAt 내림차순으로 시드.
export interface PartnerStoreListRow {
    id: string;
    name: string;
    ownerName: string;
    status: StoreStatus;
    createdAt: string;
}
const SEEDED_PARTNER_STORES: PartnerStoreListRow[] = [
    {
        id: 'store-seed-0001',
        name: '흙과 사람',
        ownerName: '김리듬',
        status: StoreStatus.PUBLISHED,
        createdAt: '2026-05-30T10:00:00.000Z',
    },
    {
        id: 'store-seed-0002',
        name: '플러스 도자기',
        ownerName: '김리듬',
        status: StoreStatus.PENDING,
        createdAt: '2026-05-25T10:00:00.000Z',
    },
    {
        id: 'store-seed-0003',
        name: '클레이 서울',
        ownerName: '김리듬',
        status: StoreStatus.SUSPENDED,
        createdAt: '2026-05-20T10:00:00.000Z',
    },
];

// 내 공방 목록: 온보딩으로 생성된 공방 + 시드 데모, 최신 생성순.
export function listPartnerStores(): PartnerStoreListRow[] {
    const created: PartnerStoreListRow[] = db.stores
        .filter((s) => {
            const partner = db.partners.find((p) => p.id === s.partnerId);
            return partner?.userId === MOCK_USER_ID;
        })
        .map((s) => ({
            id: s.id,
            name: s.name,
            ownerName: db.businessDocuments.find((d) => d.storeId === s.id)?.ownerName ?? '',
            status: s.status,
            createdAt: s.createdAt,
        }));
    return [...created, ...SEEDED_PARTNER_STORES].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
    );
}

let seq = 0;
export function genId(prefix: string): string {
    seq += 1;
    return `${prefix}-${seq.toString().padStart(4, '0')}`;
}

export function nowIso(): string {
    return new Date().toISOString();
}

export function isBusinessNumberRegistered(businessNumber: string): boolean {
    if (SEEDED_REGISTERED_BUSINESS_NUMBERS.has(businessNumber)) return true;
    return db.businessDocuments.some((d) => d.businessNumber === businessNumber);
}

export function isSlugTaken(slug: string): boolean {
    if (SEEDED_TAKEN_SLUGS.has(slug)) return true;
    return db.stores.some((s) => s.slug === slug);
}

// 온보딩 제출 → Partner(PENDING)+Store(PENDING)+BusinessDocument+OperatingHours 생성.
export function createStoreRegistration(input: StoreRegistrationSubmitRequest) {
    const createdAt = nowIso();
    const partner: PartnerRow = {
        id: genId('partner'),
        userId: MOCK_USER_ID,
        status: PartnerStatus.PENDING,
        rejectedReason: null,
        approvedAt: null,
        createdAt,
    };
    const store: StoreRow = {
        id: genId('store'),
        partnerId: partner.id,
        name: input.name,
        slug: input.slug,
        description: input.description,
        phone: input.phone,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        convenienceInfo: input.convenienceInfo,
        autoConfirm: input.autoConfirm,
        status: StoreStatus.PENDING,
        publishedAt: null,
        rejectedReason: null,
        createdAt,
    };
    const businessDoc: BusinessDocumentRow = {
        id: genId('bizdoc'),
        partnerId: partner.id,
        storeId: store.id,
        documentUrl: input.businessDocument.documentUrl,
        ownerName: input.businessDocument.ownerName,
        businessName: input.businessDocument.businessName,
        businessNumber: input.businessDocument.businessNumber,
        businessAddress: input.businessDocument.businessAddress,
        email: input.businessDocument.email,
        ocrStatus: OcrStatus.PENDING, // OCR 추후 연동
        verifiedAt: null,
    };
    const hours: OperatingHourRow[] = input.operatingHours.map((h) => ({
        id: genId('hour'),
        storeId: store.id,
        dayOfWeek: h.dayOfWeek,
        openTime: h.openTime,
        closeTime: h.closeTime,
        breakStart: h.breakStart,
        breakEnd: h.breakEnd,
    }));

    db.partners.push(partner);
    db.stores.push(store);
    db.businessDocuments.push(businessDoc);
    db.operatingHours.push(...hours);

    return { partner, store, businessDoc };
}

export function findLatestStoreRegistration() {
    const partner = db.partners.filter((p) => p.userId === MOCK_USER_ID).at(-1);
    if (!partner) return null;
    const store = db.stores.filter((s) => s.partnerId === partner.id).at(-1);
    if (!store) return null;
    const businessDoc = db.businessDocuments.filter((d) => d.storeId === store.id).at(-1) ?? null;
    return { partner, store, businessDoc };
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
// displayState 정본 샘플(plan §Design tokens "displayState.description 정본 샘플") 그대로 사용.
// 4 status(PENDING/IN_PROGRESS/SHIPPED/DELIVERED) + 미정 상태(CONFIRMED/CANCELED 등)
// 혼합. 무한스크롤 테스트를 위해 6건 이상.
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
        id: 'res-seed-0003',
        storeName: '클레이 서울',
        programTitle: '도자기 페인팅 클래스',
        scheduledAt: '2026-06-05T16:00:00.000Z',
        participantCount: 3,
        status: ReservationStatus.SHIPPED,
        displayState: {
            label: '배송중',
            description: '소중한 작품을 꼼꼼히 포장해서 보냈어요.',
            subLabel: null,
        },
        createdAt: '2026-05-25T13:45:00.000Z',
    },
    {
        id: 'res-seed-0004',
        storeName: '플러스 도자기',
        programTitle: '접시 만들기 원데이',
        scheduledAt: '2026-05-20T11:00:00.000Z',
        participantCount: 2,
        status: ReservationStatus.DELIVERED,
        // DELIVERED 는 status message UI 숨김 → description 공백 정본 패턴.
        displayState: {
            label: '작품 도착',
            description: '',
            subLabel: null,
        },
        createdAt: '2026-05-18T10:00:00.000Z',
    },
    {
        id: 'res-seed-0005',
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
        createdAt: '2026-05-10T09:30:00.000Z',
    },
    {
        id: 'res-seed-0006',
        storeName: '서래마을 도예원',
        programTitle: '주말 가족 도자기',
        scheduledAt: '2026-05-08T13:00:00.000Z',
        participantCount: 4,
        status: ReservationStatus.PENDING,
        displayState: {
            label: '예약신청',
            description: '작가님이 예약 내용을 확인하고 있어요.',
            subLabel: null,
        },
        createdAt: '2026-05-05T14:10:00.000Z',
    },
    {
        id: 'res-seed-0007',
        storeName: '클레이 서울',
        programTitle: '꽃병 만들기',
        scheduledAt: '2026-05-01T11:00:00.000Z',
        participantCount: 2,
        status: ReservationStatus.SHIPPED,
        displayState: {
            label: '배송중',
            description: '소중한 작품을 꼼꼼히 포장해서 보냈어요.',
            subLabel: null,
        },
        createdAt: '2026-04-28T09:00:00.000Z',
    },
    {
        id: 'res-seed-0008',
        storeName: '흙과 사람',
        programTitle: '캔들 홀더 만들기',
        scheduledAt: '2026-04-22T10:00:00.000Z',
        participantCount: 1,
        status: ReservationStatus.DELIVERED,
        displayState: {
            label: '작품 도착',
            description: '',
            subLabel: null,
        },
        createdAt: '2026-04-15T10:00:00.000Z',
    },
];

// 본인 예약 목록 반환(이미 createdAt 내림차순으로 시드됨).
// status 필터링은 핸들러에서 적용.
export function listMyReservations(): ReservationListItem[] {
    return SEEDED_RESERVATIONS;
}
