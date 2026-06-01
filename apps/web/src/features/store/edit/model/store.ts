import { DAY_OF_WEEK, phoneSchema, slugSchema, type StoreUpdateRequest } from '@todam/shared';
import { create } from 'zustand';

import {
    MAX_STORE_IMAGES,
    type ConvenienceState,
    type EditImage,
    type EditSection,
    type OperatingState,
    type StoreEditForm,
} from './types';

const ok = (schema: { safeParse: (v: unknown) => { success: boolean } }, v: string) =>
    schema.safeParse(v).success;

type Patch<T> = Partial<T>;

interface StoreEditStore {
    // null = 미로딩. GET preload 후 form/initial 동시 세팅.
    form: StoreEditForm | null;
    initial: StoreEditForm | null;
    // slug 중복 검사 결과 (PATCH 409 또는 실시간 검사)
    slugDuplicated: boolean;
    load: (form: StoreEditForm) => void;
    patchStore: (p: Patch<StoreEditForm['store']>) => void;
    setImages: (images: EditImage[]) => void;
    addImage: (image: EditImage) => void;
    removeImage: (id: string) => void;
    toggleConvenience: (key: keyof ConvenienceState) => void;
    patchOperating: (p: Patch<OperatingState>) => void;
    toggleBusinessDay: (day: number) => void;
    patchReservation: (p: Patch<StoreEditForm['reservation']>) => void;
    setSlugDuplicated: (v: boolean) => void;
    reset: () => void;
}

export const useStoreEditStore = create<StoreEditStore>((set) => ({
    form: null,
    initial: null,
    slugDuplicated: false,
    load: (form) => set({ form, initial: structuredClone(form), slugDuplicated: false }),
    patchStore: (p) =>
        set((s) => {
            if (!s.form) return s;
            const store = { ...s.form.store, ...p };
            const slugDuplicated = p.slug !== undefined ? false : s.slugDuplicated;
            return { form: { ...s.form, store }, slugDuplicated };
        }),
    setImages: (images) =>
        set((s) => (s.form ? { form: { ...s.form, store: { ...s.form.store, images } } } : s)),
    addImage: (image) =>
        set((s) => {
            if (!s.form || s.form.store.images.length >= MAX_STORE_IMAGES) return s;
            return {
                form: {
                    ...s.form,
                    store: { ...s.form.store, images: [...s.form.store.images, image] },
                },
            };
        }),
    removeImage: (id) =>
        set((s) =>
            s.form
                ? {
                      form: {
                          ...s.form,
                          store: {
                              ...s.form.store,
                              images: s.form.store.images.filter((img) => img.id !== id),
                          },
                      },
                  }
                : s,
        ),
    toggleConvenience: (key) =>
        set((s) =>
            s.form
                ? {
                      form: {
                          ...s.form,
                          store: {
                              ...s.form.store,
                              convenienceInfo: {
                                  ...s.form.store.convenienceInfo,
                                  [key]: !s.form.store.convenienceInfo[key],
                              },
                          },
                      },
                  }
                : s,
        ),
    patchOperating: (p) =>
        set((s) =>
            s.form ? { form: { ...s.form, operating: { ...s.form.operating, ...p } } } : s,
        ),
    toggleBusinessDay: (day) =>
        set((s) => {
            if (!s.form) return s;
            const has = s.form.operating.businessDays.includes(day);
            const businessDays = has
                ? s.form.operating.businessDays.filter((d) => d !== day)
                : [...s.form.operating.businessDays, day];
            return { form: { ...s.form, operating: { ...s.form.operating, businessDays } } };
        }),
    patchReservation: (p) =>
        set((s) =>
            s.form ? { form: { ...s.form, reservation: { ...s.form.reservation, ...p } } } : s,
        ),
    setSlugDuplicated: (v) => set({ slugDuplicated: v }),
    reset: () => set({ form: null, initial: null, slugDuplicated: false }),
}));

// ─── dirty 비교 ─────────────────────────────────────────────────
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// 전체 dirty 여부 (저장 버튼 활성/이탈 가드용)
export function isDirty(form: StoreEditForm | null, initial: StoreEditForm | null): boolean {
    if (!form || !initial) return false;
    return !eq(form, initial);
}

// businessDays + 단일 시간 → operatingHours[] 확장 (등록 제출 스키마 동일)
function toOperatingHours(o: OperatingState) {
    return [...o.businessDays]
        .sort((a, b) => a - b)
        .map((day) => ({
            dayOfWeek: DAY_OF_WEEK[day]!,
            openTime: o.openTime,
            closeTime: o.closeTime,
            breakStart: o.breakStart || null,
            breakEnd: o.breakEnd || null,
        }));
}

// ─── 섹션별 유효성 (저장 가능 여부) ──────────────────────────────
export function isSectionValid(form: StoreEditForm | null, section: EditSection): boolean {
    if (!form) return false;
    switch (section) {
        case 'info': {
            const s = form.store;
            return (
                s.images.length > 0 &&
                s.images.length <= MAX_STORE_IMAGES &&
                s.name.trim().length >= 2 &&
                s.name.trim().length <= 40 &&
                ok(slugSchema, s.slug) &&
                ok(phoneSchema, s.phone)
            );
        }
        case 'operating': {
            const o = form.operating;
            if (!o.openTime || !o.closeTime || o.openTime >= o.closeTime) return false;
            if (o.businessDays.length === 0) return false;
            if (o.breakStart || o.breakEnd) {
                if (!o.breakStart || !o.breakEnd || o.breakStart >= o.breakEnd) return false;
                // 휴식시간은 운영시간 범위 내
                if (o.breakStart < o.openTime || o.breakEnd > o.closeTime) return false;
            }
            return true;
        }
        case 'reservation': {
            const r = form.reservation;
            return r.intervalMinutes > 0 && r.maxCapacity > 0 && r.cancelDeadlineDays >= 0;
        }
        default:
            return false;
    }
}

// ─── dirty 필드만 PATCH body 구성 (DEC-2 부분 갱신) ──────────────
// operatingHours·images[]는 dirty 시 배열 전체 치환.
export function buildPatchBody(
    form: StoreEditForm,
    initial: StoreEditForm,
    section: EditSection,
): StoreUpdateRequest {
    const body: StoreUpdateRequest = {};
    if (section === 'info') {
        const s = form.store;
        const i = initial.store;
        if (s.name !== i.name) body.name = s.name;
        if (s.slug !== i.slug) body.slug = s.slug;
        if (s.phone !== i.phone) body.phone = s.phone;
        if (s.description !== i.description) body.description = s.description || null;
        if (!eq(s.convenienceInfo, i.convenienceInfo)) {
            body.convenienceInfo = { ...s.convenienceInfo };
        }
        const imageIds = s.images.map((img) => img.id);
        const initialImageIds = i.images.map((img) => img.id);
        if (!eq(imageIds, initialImageIds)) body.images = imageIds;
    } else if (section === 'operating') {
        const o = form.operating;
        const i = initial.operating;
        if (!eq(o, i)) body.operatingHours = toOperatingHours(o);
        // 편의 정보는 영업 화면에서도 노출되므로 변경 시 포함
        if (!eq(form.store.convenienceInfo, initial.store.convenienceInfo)) {
            body.convenienceInfo = { ...form.store.convenienceInfo };
        }
    } else if (section === 'reservation') {
        const r = form.reservation;
        const i = initial.reservation;
        if (r.intervalMinutes !== i.intervalMinutes) {
            body.reservationIntervalMinutes = r.intervalMinutes;
        }
        if (r.cancelDeadlineDays !== i.cancelDeadlineDays) {
            body.cancelDeadlineDays = r.cancelDeadlineDays;
        }
        if (r.maxCapacity !== i.maxCapacity) body.maxCapacityPerSlot = r.maxCapacity;
        if (r.autoConfirm !== i.autoConfirm) body.autoConfirm = r.autoConfirm;
    }
    return body;
}
