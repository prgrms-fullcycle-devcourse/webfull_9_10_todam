import {
    OcrStatus,
    PartnerStatus,
    ProgramStatus,
    StoreStatus,
    type ConvenienceInfo,
    type DayOfWeek,
    type PartnerProgramListItem,
    type StoreDetail,
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

// ─── 공방 상세 시드 (파트너센터) ────────────────────────────────
// 목록 시드(store-seed-0001~0003)와 동일 id 로 상세를 구성. API Contract 스키마 그대로.
const SEEDED_STORE_DETAILS: Record<string, StoreDetail> = {
    'store-seed-0001': {
        id: 'store-seed-0001',
        partnerId: 'partner-seed-0001',
        name: '흙과 사람',
        slug: 'soil-and-people',
        description: '흙과 함께하는 도자기 체험 공방입니다.\n초보자도 편하게 즐길 수 있어요.',
        phone: '02-1234-5678',
        address: '서울특별시 성동구 성수이로 12길 34',
        latitude: 37.5446,
        longitude: 127.0556,
        convenienceInfo: { parking: true, pet: false, wifi: true },
        autoConfirm: false,
        cancelDeadlineDays: 1,
        status: StoreStatus.PUBLISHED,
        rejectedReason: null,
        suspendedReason: null,
        rating: 4.8,
        reviewCount: 132,
        inProgressReservationCount: 5,
        operatingHours: [
            {
                dayOfWeek: 'MON',
                openTime: '10:00',
                closeTime: '19:00',
                breakStart: '13:00',
                breakEnd: '14:00',
            },
        ],
        images: [
            {
                id: 'img-seed-001',
                imageUrl: 'https://picsum.photos/seed/todam1/600/600',
                thumbnailUrl: 'https://picsum.photos/seed/todam1/200/200',
                isThumbnail: true,
                sortOrder: 1,
            },
            {
                id: 'img-seed-002',
                imageUrl: 'https://picsum.photos/seed/todam2/600/600',
                thumbnailUrl: 'https://picsum.photos/seed/todam2/200/200',
                isThumbnail: false,
                sortOrder: 2,
            },
        ],
        businessDocument: {
            ownerName: '김리듬',
            email: 'partner@example.com',
            businessName: '흙과 사람',
            businessNumber: '111-22-33333',
            businessAddress: '서울특별시 성동구 성수이로 12길 34',
            ocrStatus: OcrStatus.VERIFIED,
        },
        publishedAt: '2026-05-30T10:00:00.000Z',
        createdAt: '2026-05-30T10:00:00.000Z',
    },
    // 클래스 0개 케이스(empty UI 확인용).
    'store-seed-0002': {
        id: 'store-seed-0002',
        partnerId: 'partner-seed-0002',
        name: '플러스 도자기',
        slug: 'plus-ceramic',
        description: '검수 진행 중인 공방입니다.',
        phone: '02-2222-3333',
        address: '서울특별시 마포구 와우산로 10',
        latitude: 37.5512,
        longitude: 126.925,
        convenienceInfo: { parking: false, pet: false, wifi: false },
        autoConfirm: true,
        cancelDeadlineDays: 2,
        status: StoreStatus.PENDING,
        rejectedReason: null,
        suspendedReason: null,
        rating: 0,
        reviewCount: 0,
        inProgressReservationCount: 0,
        operatingHours: [],
        images: [],
        businessDocument: {
            ownerName: '김리듬',
            email: 'partner@example.com',
            businessName: '플러스 도자기',
            businessNumber: '222-33-44444',
            businessAddress: '서울특별시 마포구 와우산로 10',
            ocrStatus: OcrStatus.PENDING,
        },
        publishedAt: null,
        createdAt: '2026-05-25T10:00:00.000Z',
    },
};

// 운영 클래스 목록 시드. store-seed-0001 만 보유, store-seed-0002 는 empty([]).
const SEEDED_PROGRAMS: Record<string, PartnerProgramListItem[]> = {
    'store-seed-0001': [
        {
            id: 'prog-seed-001',
            title: '도자기 물레 원데이 클래스',
            status: ProgramStatus.ACTIVE,
            thumbnailUrl: 'https://picsum.photos/seed/prog1/200/200',
            price: 45000,
            durationMinutes: 120,
            createdAt: '2026-05-19T09:00:00.000Z',
        },
        {
            id: 'prog-seed-002',
            title: '핸드빌딩 머그컵 만들기',
            status: ProgramStatus.DRAFT,
            thumbnailUrl: 'https://picsum.photos/seed/prog2/200/200',
            price: 38000,
            durationMinutes: 90,
            createdAt: '2026-05-21T09:00:00.000Z',
        },
        {
            id: 'prog-seed-003',
            title: '커플 도자기 클래스 (일시 중단)',
            status: ProgramStatus.INACTIVE,
            thumbnailUrl: 'https://picsum.photos/seed/prog3/200/200',
            price: 88000,
            durationMinutes: 150,
            createdAt: '2026-05-22T09:00:00.000Z',
        },
    ],
};

// 공방 상세 조회: 본인 소유 시드/온보딩 공방만. 미존재 시 null(→404).
export function findPartnerStoreDetail(storeId: string): StoreDetail | null {
    return SEEDED_STORE_DETAILS[storeId] ?? null;
}

// 공방 운영 클래스 목록: 미존재 공방은 null(→404), 보유 0개는 [].
export function findPartnerStorePrograms(storeId: string): PartnerProgramListItem[] | null {
    if (!SEEDED_STORE_DETAILS[storeId]) return null;
    return SEEDED_PROGRAMS[storeId] ?? [];
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
