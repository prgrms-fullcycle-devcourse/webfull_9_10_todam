import {
    ArtworkStatus,
    OcrStatus,
    PartnerStatus,
    ProgramStatus,
    ReservationDeliveryMethod,
    ReservationStatus,
    StoreStatus,
    ProgramDeliveryOption,
    ProgramDifficulty,
    type ArtworkDetail,
    type ConvenienceInfo,
    type DayOfWeek,
    type FavoriteStoreItem,
    type OperatingHourInput,
    type PartnerProgramListItem,
    type PartnerStoreDetail,
    type ReservationDetail,
    type ReservationListItem,
    type ReviewDetail,
    type StoreImage,
    type StoreRegistrationSubmitRequest,
    type ProgramImage,
    type StoreUpdateRequest,
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

// ─── 찜한 공방 mock ──────────────────────────────────────────────
// 찜한 공방 목록 seed (최신 찜순 = createdAt 내림차순). 무한스크롤/빈상태 검증용 ≥ 12개.
// 모두 PUBLISHED 공방 가정(목록은 PUBLISHED 만 노출 — 요구사항 store §1·§4).
const SEEDED_FAVORITE_STORES: FavoriteStoreItem[] = [
    {
        favoriteId: 'fav-seed-0012',
        storeId: 'store-fav-0012',
        name: '토담 공방 성수점',
        category: '도자기',
        imageUrl: 'https://placehold.co/80x80?text=ceramic',
        address: '서울특별시 성동구 성수이로 12길',
        createdAt: '2026-05-30T18:00:00.000Z',
    },
    {
        favoriteId: 'fav-seed-0011',
        storeId: 'store-fav-0011',
        name: '흙과 사람',
        category: '도자기',
        imageUrl: 'https://placehold.co/80x80?text=clay',
        address: '서울특별시 성동구 뚝섬로 273',
        createdAt: '2026-05-29T17:30:00.000Z',
    },
    {
        favoriteId: 'fav-seed-0010',
        storeId: 'store-fav-0010',
        name: '플러스 도자기',
        category: '도자기',
        imageUrl: 'https://placehold.co/80x80?text=pottery',
        address: '서울특별시 마포구 와우산로 100',
        createdAt: '2026-05-28T16:00:00.000Z',
    },
    {
        favoriteId: 'fav-seed-0009',
        storeId: 'store-fav-0009',
        name: '클레이 서울',
        category: '공예',
        imageUrl: 'https://placehold.co/80x80?text=craft',
        address: '서울특별시 종로구 자하문로 50',
        createdAt: '2026-05-27T15:20:00.000Z',
    },
    {
        favoriteId: 'fav-seed-0008',
        storeId: 'store-fav-0008',
        name: '온도 스튜디오',
        category: '캔들',
        imageUrl: 'https://placehold.co/80x80?text=candle',
        address: '서울특별시 용산구 이태원로 200',
        createdAt: '2026-05-26T14:10:00.000Z',
    },
    {
        favoriteId: 'fav-seed-0007',
        storeId: 'store-fav-0007',
        name: '백자방',
        category: '도자기',
        imageUrl: 'https://placehold.co/80x80?text=white',
        address: '서울특별시 강남구 도산대로 33',
        createdAt: '2026-05-25T13:00:00.000Z',
    },
    {
        favoriteId: 'fav-seed-0006',
        storeId: 'store-fav-0006',
        name: '나무공방 손길',
        category: '목공',
        imageUrl: 'https://placehold.co/80x80?text=wood',
        address: '서울특별시 마포구 성미산로 80',
        createdAt: '2026-05-24T12:00:00.000Z',
    },
    {
        favoriteId: 'fav-seed-0005',
        storeId: 'store-fav-0005',
        name: '가죽공방 무드',
        category: '가죽',
        imageUrl: 'https://placehold.co/80x80?text=leather',
        address: '서울특별시 서대문구 연희로 11',
        createdAt: '2026-05-23T11:30:00.000Z',
    },
    {
        favoriteId: 'fav-seed-0004',
        storeId: 'store-fav-0004',
        name: '유리공방 빛',
        category: '유리',
        imageUrl: 'https://placehold.co/80x80?text=glass',
        address: '서울특별시 성북구 동소문로 5',
        createdAt: '2026-05-22T10:40:00.000Z',
    },
    {
        favoriteId: 'fav-seed-0003',
        storeId: 'store-fav-0003',
        name: '향기연구소',
        category: '향수',
        imageUrl: 'https://placehold.co/80x80?text=perfume',
        address: '서울특별시 강동구 천호대로 900',
        createdAt: '2026-05-21T09:50:00.000Z',
    },
    {
        favoriteId: 'fav-seed-0002',
        storeId: 'store-fav-0002',
        name: '플라워 아틀리에',
        category: '플라워',
        imageUrl: 'https://placehold.co/80x80?text=flower',
        address: '서울특별시 송파구 올림픽로 240',
        createdAt: '2026-05-20T09:00:00.000Z',
    },
    {
        favoriteId: 'fav-seed-0001',
        storeId: 'store-fav-0001',
        name: '실과 바늘',
        category: '자수',
        imageUrl: 'https://placehold.co/80x80?text=embroidery',
        address: '서울특별시 영등포구 여의대로 24',
        createdAt: '2026-05-19T08:30:00.000Z',
    },
];

// 찜한 공방 storeId 집합 (mock). seed 의 storeId 로 초기화.
export const likedStores = new Set<string>(SEEDED_FAVORITE_STORES.map((s) => s.storeId));

// 찜 토글: 이력 없으면 add → true(등록됨), 있으면 delete → false(해제됨).
export function toggleFavorite(storeId: string): boolean {
    if (likedStores.has(storeId)) {
        likedStores.delete(storeId);
        return false;
    }
    likedStores.add(storeId);
    return true;
}

// 찜한 공방 목록(커서 페이지네이션). createdAt 내림차순 + favoriteId 커서 슬라이스.
// likedStores 와 동기화: 토글로 해제된 공방은 목록에서 제외.
export function listFavoriteStores(
    cursor: string | null,
    limit: number,
): { favoriteStores: FavoriteStoreItem[]; nextCursor: string | null } {
    const all = SEEDED_FAVORITE_STORES.filter((s) => likedStores.has(s.storeId)).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
    );

    let startIdx = 0;
    if (cursor) {
        const idx = all.findIndex((s) => s.favoriteId === cursor);
        startIdx = idx >= 0 ? idx + 1 : all.length; // cursor 미존재 시 빈 결과.
    }

    // limit+1 방식으로 다음 페이지 존재 여부 판정.
    const window = all.slice(startIdx, startIdx + limit + 1);
    const hasMore = window.length > limit;
    const favoriteStores = window.slice(0, limit);
    const nextCursor = hasMore
        ? (favoriteStores[favoriteStores.length - 1]?.favoriteId ?? null)
        : null;

    return { favoriteStores, nextCursor };
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

// ─── 프로그램 mock DB ────────────────────────────────────────────

export interface ProgramRow {
    id: string;
    storeId: string;
    title: string;
    description: string | null;
    materials: string | null;
    price: number;
    durationMinutes: number;
    capacity: number;
    leadTimeDays: number;
    difficulty: ProgramDifficulty;
    deliveryOption: ProgramDeliveryOption;
    childrenAllowed: boolean;
    deliveryAvailable: boolean;
    status: ProgramStatus;
    updatedAt: string;
}

export interface ProgramImageRow {
    programImageId: string;
    programId: string;
    imageUrl: string;
    thumbnailUrl: string;
    isThumbnail: boolean;
}

// 시드: 테스트용 공방 + 프로그램 데이터
export const MOCK_STORE_ID = 'store-seed-0001';
export const MOCK_STORE_SLUG = 'todam-pottery';

export const seededPrograms: ProgramRow[] = [
    {
        id: 'prog-uuid-001',
        storeId: MOCK_STORE_ID,
        title: '물레 체험 기초반',
        description: '처음 도자기를 접하는 분들을 위한 물레 체험입니다.',
        materials: '앞치마 (공방 제공), 편한 복장',
        price: 45000,
        durationMinutes: 120,
        capacity: 6,
        leadTimeDays: 30,
        difficulty: ProgramDifficulty.BASIC,
        deliveryOption: ProgramDeliveryOption.CUSTOMER_SELECT,
        childrenAllowed: true,
        deliveryAvailable: false,
        status: ProgramStatus.ACTIVE,
        updatedAt: '2026-05-25T19:05:00.000Z',
    },
];

export const seededProgramImages: ProgramImageRow[] = [
    {
        programImageId: 'prog-img-uuid-001',
        programId: 'prog-uuid-001',
        imageUrl: 'https://cdn.todam.app/programs/prog-uuid-001/01.jpg',
        thumbnailUrl: 'https://cdn.todam.app/programs/prog-uuid-001/01_thumb.jpg',
        isThumbnail: true,
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

export function addProgramImage(
    programId: string,
    image: Omit<ProgramImageRow, 'programId'>,
): ProgramImageRow {
    const row: ProgramImageRow = { ...image, programId };
    seededProgramImages.push(row);
    return row;
}

export function removeProgramImage(imageId: string): boolean {
    const idx = seededProgramImages.findIndex((img) => img.programImageId === imageId);
    if (idx === -1) return false;
    seededProgramImages.splice(idx, 1);
    return true;
}

export function programToApiShape(program: ProgramRow): object {
    const images: ProgramImage[] = getProgramImages(program.id).map((img) => ({
        programImageId: img.programImageId,
        imageUrl: img.imageUrl,
        thumbnailUrl: img.thumbnailUrl,
        isThumbnail: img.isThumbnail,
    }));
    return {
        id: program.id,
        storeId: program.storeId,
        title: program.title,
        description: program.description,
        materials: program.materials,
        price: program.price,
        durationMinutes: program.durationMinutes,
        capacity: program.capacity,
        leadTimeDays: program.leadTimeDays,
        difficulty: program.difficulty,
        deliveryOption: program.deliveryOption,
        childrenAllowed: program.childrenAllowed,
        deliveryAvailable: program.deliveryAvailable,
        status: program.status,
        images,
    };
}

// ─── 공방 상세(수정 화면 preload) mock ──────────────────────────
// 파트너센터 공방 상세 — GET/PATCH/이미지 엔드포인트가 참조하는 인메모리 저장소.
// 목록 시드(SEEDED_PARTNER_STORES)와 id 정합. createStoreRegistration 생성분도 lazy 보강.
const storeDetails: Record<string, PartnerStoreDetail> = {
    'store-seed-0001': {
        id: 'store-seed-0001',
        partnerId: 'partner-seed-0001',
        name: '흙과 사람',
        slug: 'heuk-saram',
        description: '흙과 함께하는 도자기 체험 공방입니다.',
        phone: '02-1234-5678',
        address: '서울특별시 성동구 성수이로 12길 34',
        latitude: 37.5446,
        longitude: 127.0556,
        convenienceInfo: { parking: true, pet: false, wifi: true },
        autoConfirm: false,
        cancelDeadlineDays: 1,
        reservationIntervalMinutes: 60,
        maxCapacityPerSlot: 6,
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
            {
                dayOfWeek: 'TUE',
                openTime: '10:00',
                closeTime: '19:00',
                breakStart: '13:00',
                breakEnd: '14:00',
            },
            {
                dayOfWeek: 'WED',
                openTime: '10:00',
                closeTime: '19:00',
                breakStart: '13:00',
                breakEnd: '14:00',
            },
        ],
        images: [
            {
                id: 'img-seed-0001',
                imageUrl: 'https://placehold.co/400x300?text=workshop',
                thumbnailUrl: 'https://placehold.co/200x150?text=workshop',
                isThumbnail: true,
                sortOrder: 1,
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
        publishedAt: '2026-05-20T10:00:00.000Z',
        createdAt: '2026-05-30T10:00:00.000Z',
    },
    'store-seed-0002': {
        id: 'store-seed-0002',
        partnerId: 'partner-seed-0002',
        name: '플러스 도자기',
        slug: 'plus-pottery',
        description: null,
        phone: '02-2222-3333',
        address: '서울특별시 마포구 와우산로 100',
        latitude: 37.5512,
        longitude: 126.9223,
        convenienceInfo: { parking: false, pet: true, wifi: false },
        autoConfirm: true,
        cancelDeadlineDays: 2,
        reservationIntervalMinutes: 90,
        maxCapacityPerSlot: 4,
        status: StoreStatus.PENDING,
        rejectedReason: null,
        suspendedReason: null,
        rating: 0,
        reviewCount: 0,
        inProgressReservationCount: 0,
        operatingHours: [
            {
                dayOfWeek: 'SAT',
                openTime: '11:00',
                closeTime: '20:00',
                breakStart: null,
                breakEnd: null,
            },
            {
                dayOfWeek: 'SUN',
                openTime: '11:00',
                closeTime: '20:00',
                breakStart: null,
                breakEnd: null,
            },
        ],
        images: [
            {
                id: 'img-seed-0002',
                imageUrl: 'https://placehold.co/400x300?text=pottery',
                thumbnailUrl: 'https://placehold.co/200x150?text=pottery',
                isThumbnail: true,
                sortOrder: 1,
            },
        ],
        businessDocument: {
            ownerName: '김리듬',
            email: 'partner@example.com',
            businessName: '플러스 도자기',
            businessNumber: '222-33-44444',
            businessAddress: '서울특별시 마포구 와우산로 100',
            ocrStatus: OcrStatus.PENDING,
        },
        publishedAt: null,
        createdAt: '2026-05-25T10:00:00.000Z',
    },
    'store-seed-0003': {
        id: 'store-seed-0003',
        partnerId: 'partner-seed-0003',
        name: '클레이 서울',
        slug: 'clay-seoul',
        description: '도심 속 작은 도예 작업실.',
        phone: '02-5555-6666',
        address: '서울특별시 종로구 자하문로 50',
        latitude: 37.5821,
        longitude: 126.9706,
        convenienceInfo: { parking: false, pet: false, wifi: true },
        autoConfirm: false,
        cancelDeadlineDays: 1,
        reservationIntervalMinutes: 120,
        maxCapacityPerSlot: 8,
        status: StoreStatus.SUSPENDED,
        rejectedReason: null,
        suspendedReason: '운영 정책 위반으로 노출이 중단되었습니다.',
        rating: 4.5,
        reviewCount: 21,
        inProgressReservationCount: 0,
        operatingHours: [
            {
                dayOfWeek: 'MON',
                openTime: '09:00',
                closeTime: '18:00',
                breakStart: null,
                breakEnd: null,
            },
        ],
        images: [
            {
                id: 'img-seed-0003',
                imageUrl: 'https://placehold.co/400x300?text=clay',
                thumbnailUrl: 'https://placehold.co/200x150?text=clay',
                isThumbnail: true,
                sortOrder: 1,
            },
        ],
        businessDocument: {
            ownerName: '김리듬',
            email: 'partner@example.com',
            businessName: '클레이 서울',
            businessNumber: '333-44-55555',
            businessAddress: '서울특별시 종로구 자하문로 50',
            ocrStatus: OcrStatus.VERIFIED,
        },
        publishedAt: null,
        createdAt: '2026-05-20T10:00:00.000Z',
    },
};

// 온보딩(db.stores)으로 생성된 공방을 상세 형태로 lazy 변환.
function buildDetailFromCreated(id: string): PartnerStoreDetail | undefined {
    const store = db.stores.find((s) => s.id === id);
    if (!store) return undefined;
    const doc = db.businessDocuments.find((d) => d.storeId === id);
    const hours: OperatingHourInput[] = db.operatingHours
        .filter((h) => h.storeId === id)
        .map((h) => ({
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            breakStart: h.breakStart,
            breakEnd: h.breakEnd,
        }));
    return {
        id: store.id,
        partnerId: store.partnerId,
        name: store.name,
        slug: store.slug,
        description: store.description || null,
        phone: store.phone,
        address: store.address,
        latitude: store.latitude,
        longitude: store.longitude,
        convenienceInfo: store.convenienceInfo,
        autoConfirm: store.autoConfirm,
        cancelDeadlineDays: 1,
        reservationIntervalMinutes: 60,
        maxCapacityPerSlot: 4,
        status: store.status,
        rejectedReason: store.rejectedReason,
        suspendedReason: null,
        rating: 0,
        reviewCount: 0,
        inProgressReservationCount: 0,
        operatingHours: hours,
        images: [],
        businessDocument: {
            ownerName: doc?.ownerName ?? '',
            email: doc?.email ?? '',
            businessName: doc?.businessName ?? '',
            businessNumber: doc?.businessNumber ?? '',
            businessAddress: doc?.businessAddress ?? '',
            ocrStatus: doc?.ocrStatus ?? OcrStatus.PENDING,
        },
        publishedAt: store.publishedAt,
        createdAt: store.createdAt,
    };
}

export function getStoreDetail(id: string): PartnerStoreDetail | undefined {
    if (storeDetails[id]) return storeDetails[id];
    const built = buildDetailFromCreated(id);
    if (built) {
        storeDetails[id] = built;
        return built;
    }
    return undefined;
}

// ─── 운영 클래스 목록 시드 (GET /partner/stores/{storeId}/programs) ──
// store-seed-0001 만 보유, store-seed-0002 는 empty([]) — empty UI 확인용.
const storePrograms: Record<string, PartnerProgramListItem[]> = {
    'store-seed-0001': [
        {
            id: 'prog-seed-0001',
            title: '도자기 물레 원데이 클래스',
            status: ProgramStatus.ACTIVE,
            thumbnailUrl: 'https://placehold.co/200x150?text=wheel',
            price: 45000,
            durationMinutes: 120,
            capacity: 6,
            sortOrder: 1,
            createdAt: '2026-05-21T09:00:00.000Z',
        },
        {
            id: 'prog-seed-0002',
            title: '핸드빌딩 머그컵 만들기',
            status: ProgramStatus.DRAFT,
            thumbnailUrl: 'https://placehold.co/200x150?text=mug',
            price: 38000,
            durationMinutes: 90,
            capacity: 8,
            sortOrder: 2,
            createdAt: '2026-05-22T09:00:00.000Z',
        },
        {
            id: 'prog-seed-0003',
            title: '커플 도자기 클래스 (일시 중단)',
            status: ProgramStatus.INACTIVE,
            thumbnailUrl: 'https://placehold.co/200x150?text=couple',
            price: 88000,
            durationMinutes: 150,
            capacity: 2,
            sortOrder: 3,
            createdAt: '2026-05-23T09:00:00.000Z',
        },
    ],
};

// 운영 클래스 목록 조회. 공방 미존재 시 null(→404), 존재하나 클래스 없으면 [].
export function findPartnerStorePrograms(id: string): PartnerProgramListItem[] | null {
    if (!getStoreDetail(id)) return null;
    return storePrograms[id] ?? [];
}

// PATCH: 전달된 필드만 갱신(부분 갱신), operatingHours·images는 배열 전체 치환. status 불변.
export function updateStoreDetail(
    id: string,
    body: StoreUpdateRequest,
): PartnerStoreDetail | undefined {
    const detail = getStoreDetail(id);
    if (!detail) return undefined;
    if (body.name !== undefined) detail.name = body.name;
    if (body.slug !== undefined) detail.slug = body.slug;
    if (body.description !== undefined) detail.description = body.description;
    if (body.phone !== undefined) detail.phone = body.phone;
    // 주소(address/위경도)는 수정 Out scope — PATCH 대상 아님.
    if (body.convenienceInfo !== undefined) detail.convenienceInfo = body.convenienceInfo;
    if (body.autoConfirm !== undefined) detail.autoConfirm = body.autoConfirm;
    if (body.cancelDeadlineDays !== undefined) detail.cancelDeadlineDays = body.cancelDeadlineDays;
    if (body.reservationIntervalMinutes !== undefined)
        detail.reservationIntervalMinutes = body.reservationIntervalMinutes;
    if (body.maxCapacityPerSlot !== undefined) detail.maxCapacityPerSlot = body.maxCapacityPerSlot;
    if (body.operatingHours !== undefined) detail.operatingHours = body.operatingHours;
    if (body.images !== undefined) {
        // 최종 이미지 id 목록 기준으로 재구성(순서·대표 반영).
        const next: StoreImage[] = body.images.map((imgId, i) => {
            const existing =
                detail.images.find((img) => img.id === imgId) ??
                pendingImages.find((img) => img.id === imgId);
            return {
                id: imgId,
                imageUrl: existing?.imageUrl ?? `https://placehold.co/400x300?text=${imgId}`,
                thumbnailUrl:
                    existing?.thumbnailUrl ?? `https://placehold.co/200x150?text=${imgId}`,
                isThumbnail: i === 0,
                sortOrder: i + 1,
            };
        });
        detail.images = next;
    }
    return detail;
}

export function isSlugTakenByOther(slug: string, storeId: string): boolean {
    if (SEEDED_TAKEN_SLUGS.has(slug)) return true;
    if (db.stores.some((s) => s.slug === slug && s.id !== storeId)) return true;
    return Object.values(storeDetails).some((d) => d.slug === slug && d.id !== storeId);
}

// ─── 이미지 presigned mock ──────────────────────────────────────
// confirm 전까지 보관하는 임시 이미지 (PENDING). 최종 반영은 PATCH images[].
interface PendingImage extends StoreImage {
    status: 'PENDING' | 'UPLOADED';
}
const pendingImages: PendingImage[] = [];

export function createPendingImage(
    storeId: string,
    fileName: string,
    isThumbnail: boolean,
): { imageId: string; uploadUrl: string; imageUrl: string } {
    const imageId = genId('img');
    const imageUrl = `https://placehold.co/400x300?text=${encodeURIComponent(fileName)}`;
    pendingImages.push({
        id: imageId,
        imageUrl,
        thumbnailUrl: `https://placehold.co/200x150?text=${encodeURIComponent(fileName)}`,
        isThumbnail,
        sortOrder: pendingImages.length + 1,
        status: 'PENDING',
    });
    return {
        imageId,
        uploadUrl: `https://todam-bucket.s3.ap-northeast-2.amazonaws.com/stores/${storeId}/images/${imageId}.jpg?mock=1`,
        imageUrl,
    };
}

export function confirmPendingImage(imageId: string): boolean {
    const img = pendingImages.find((i) => i.id === imageId);
    if (!img) return false;
    if (img.status === 'UPLOADED') return false; // ALREADY_UPLOADED
    img.status = 'UPLOADED';
    return true;
}

export function deleteStoreImage(storeId: string, imageId: string): boolean {
    const pIdx = pendingImages.findIndex((i) => i.id === imageId);
    if (pIdx >= 0) {
        pendingImages.splice(pIdx, 1);
        return true;
    }
    const detail = getStoreDetail(storeId);
    if (!detail) return false;
    const before = detail.images.length;
    detail.images = detail.images.filter((img) => img.id !== imageId);
    return detail.images.length < before;
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
        category: '도자기',
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
        category: '도자기',
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
        category: '도자기',
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
        category: '도자기',
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
        category: '도자기',
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
        category: '도자기',
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
        category: '도자기',
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
        category: '도자기',
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
        category: '도자기',
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
        category: '도자기',
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
        category: '도자기',
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

export function getDeliveryEdit(reservationId: string): DeliveryEditRecord | undefined {
    return deliveryEdits[reservationId];
}

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
// - D1: imageUrl / thumbnailUrl 둘 다 채워 production 패턴 시연.
const ARTWORK_SEED_THUMB = (slug: string) =>
    `https://placehold.co/64x64?text=${encodeURIComponent(slug)}`;
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
                        thumbnailUrl: ARTWORK_SEED_THUMB('drying-1'),
                        imageUrl: ARTWORK_SEED_IMG('drying-1'),
                    },
                    {
                        thumbnailUrl: ARTWORK_SEED_THUMB('drying-2'),
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
                        thumbnailUrl: ARTWORK_SEED_THUMB('drying-1'),
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
                        thumbnailUrl: ARTWORK_SEED_THUMB('bisque-1'),
                        imageUrl: ARTWORK_SEED_IMG('bisque-1'),
                    },
                    {
                        thumbnailUrl: ARTWORK_SEED_THUMB('bisque-2'),
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
                        thumbnailUrl: ARTWORK_SEED_THUMB('glazing-1'),
                        imageUrl: ARTWORK_SEED_IMG('glazing-1'),
                    },
                    {
                        thumbnailUrl: ARTWORK_SEED_THUMB('glazing-2'),
                        imageUrl: ARTWORK_SEED_IMG('glazing-2'),
                    },
                    {
                        thumbnailUrl: ARTWORK_SEED_THUMB('glazing-3'),
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
