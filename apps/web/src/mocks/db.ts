import {
    OcrStatus,
    PartnerStatus,
    StoreStatus,
    ProgramDeliveryOption,
    ProgramStatus,
    ProgramDifficulty,
    type ConvenienceInfo,
    type DayOfWeek,
    type StoreRegistrationSubmitRequest,
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
