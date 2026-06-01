import {
    OcrStatus,
    PartnerStatus,
    StoreStatus,
    type ConvenienceInfo,
    type DayOfWeek,
    type OperatingHourInput,
    type PartnerStoreDetail,
    type StoreImage,
    type StoreRegistrationSubmitRequest,
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
        suspededReason: null,
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
        suspededReason: null,
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
        suspededReason: '운영 정책 위반으로 노출이 중단되었습니다.',
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
        suspededReason: null,
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
    if (body.address !== undefined) detail.address = body.address;
    if (body.latitude !== undefined) detail.latitude = body.latitude;
    if (body.longitude !== undefined) detail.longitude = body.longitude;
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
