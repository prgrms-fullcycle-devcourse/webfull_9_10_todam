import { DAY_OF_WEEK, phoneSchema, slugSchema, type StoreUpdateRequest } from '@todam/shared';
import { create } from 'zustand';

import { filterValidImageFiles } from '@/shared/lib/imageFile';
import type { PendingImage } from '@/shared/model';
import {
    MAX_STORE_IMAGES,
    type ConvenienceState,
    type EditSection,
    type OperatingState,
    type StudioEditForm,
} from './types';

const ok = (schema: { safeParse: (v: unknown) => { success: boolean } }, v: string) =>
    schema.safeParse(v).success;

type Patch<T> = Partial<T>;

interface StudioEditStore {
    // null = 미로딩. GET preload 후 form/initial 동시 세팅.
    form: StudioEditForm | null;
    initial: StudioEditForm | null;
    // 신규 업로드 대기 이미지 (저장 시 일괄 업로드). form 과 별개로 관리.
    pendingImages: PendingImage[];
    // 삭제 예정 기존 이미지 id (저장 시 일괄 DELETE).
    deletedImageIds: string[];
    // slug 중복 검사 결과 (PATCH 409 또는 실시간 검사)
    slugDuplicated: boolean;
    load: (form: StudioEditForm) => void;
    patchStudio: (p: Patch<StudioEditForm['store']>) => void;
    // 파일 선택 → 대기 이미지 추가 (검증·정원 제한 포함). 즉시 업로드하지 않음.
    addImageFiles: (files: File[]) => void;
    // 기존 이미지 삭제 예정 처리 (form 에서 제거 + deletedImageIds 적재).
    removeExistingImage: (id: string) => void;
    // 대기 이미지 취소 (objectURL 정리).
    removePendingImage: (index: number) => void;
    toggleConvenience: (key: keyof ConvenienceState) => void;
    patchOperating: (p: Patch<OperatingState>) => void;
    toggleBusinessDay: (day: number) => void;
    patchReservation: (p: Patch<StudioEditForm['reservation']>) => void;
    setSlugDuplicated: (v: boolean) => void;
    reset: () => void;
}

export const useStudioEditStore = create<StudioEditStore>((set) => ({
    form: null,
    initial: null,
    pendingImages: [],
    deletedImageIds: [],
    slugDuplicated: false,
    load: (form) =>
        set({
            form,
            initial: structuredClone(form),
            pendingImages: [],
            deletedImageIds: [],
            slugDuplicated: false,
        }),
    patchStudio: (p) =>
        set((s) => {
            if (!s.form) return s;
            const store = { ...s.form.store, ...p };
            const slugDuplicated = p.slug !== undefined ? false : s.slugDuplicated;
            return { form: { ...s.form, store }, slugDuplicated };
        }),
    addImageFiles: (files) =>
        set((s) => {
            if (!s.form) return s;
            const used = s.form.store.images.length + s.pendingImages.length;
            const room = MAX_STORE_IMAGES - used;
            if (room <= 0) return s;
            const valid = filterValidImageFiles(files).slice(0, room);
            if (valid.length === 0) return s;
            const empty = used === 0;
            const added: PendingImage[] = valid.map((file, i) => ({
                file,
                previewUrl: URL.createObjectURL(file),
                isThumbnail: empty && i === 0,
            }));
            return { pendingImages: [...s.pendingImages, ...added] };
        }),
    removeExistingImage: (id) =>
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
                      deletedImageIds: [...s.deletedImageIds, id],
                  }
                : s,
        ),
    removePendingImage: (index) =>
        set((s) => {
            const updated = [...s.pendingImages];
            const [removed] = updated.splice(index, 1);
            if (removed) URL.revokeObjectURL(removed.previewUrl);
            return { pendingImages: updated };
        }),
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
    reset: () =>
        set((s) => {
            s.pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
            return {
                form: null,
                initial: null,
                pendingImages: [],
                deletedImageIds: [],
                slugDuplicated: false,
            };
        }),
}));

// ─── dirty 비교 ─────────────────────────────────────────────────
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// 전체 dirty 여부 (저장 버튼 활성/이탈 가드용).
// 대기 이미지는 form 밖에 있으므로 별도로 OR. 기존 이미지 삭제는 form 변경으로 이미 잡힘.
export function isDirty(
    form: StudioEditForm | null,
    initial: StudioEditForm | null,
    pendingCount = 0,
): boolean {
    if (!form || !initial) return false;
    return pendingCount > 0 || !eq(form, initial);
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
export function isSectionValid(
    form: StudioEditForm | null,
    section: EditSection,
    pendingCount = 0,
): boolean {
    if (!form) return false;
    switch (section) {
        case 'info': {
            const s = form.store;
            const imageCount = s.images.length + pendingCount;
            return (
                imageCount > 0 &&
                imageCount <= MAX_STORE_IMAGES &&
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
    form: StudioEditForm,
    initial: StudioEditForm,
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
        // images[] 는 업로드 완료 후 id 가 확정되므로 저장 핸들러에서 buildImageIds 로 채운다.
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
            // UI는 60/90/120/180만 설정 — contract literal union으로 좁힘.
            body.reservationIntervalMinutes =
                r.intervalMinutes as StoreUpdateRequest['reservationIntervalMinutes'];
        }
        if (r.cancelDeadlineDays !== i.cancelDeadlineDays) {
            body.cancelDeadlineDays = r.cancelDeadlineDays;
        }
        if (r.maxCapacity !== i.maxCapacity) body.maxCapacityPerSlot = r.maxCapacity;
        if (r.autoConfirm !== i.autoConfirm) body.autoConfirm = r.autoConfirm;
    }
    return body;
}

// 저장 시 최종 images[] id 목록 계산 (남은 기존 + 업로드 완료 신규 순서 유지).
// initial 대비 변경 없으면 undefined → PATCH 에서 생략.
export function buildImageIds(
    form: StudioEditForm,
    initial: StudioEditForm,
    uploadedIds: string[],
): string[] | undefined {
    const next = [...form.store.images.map((img) => img.id), ...uploadedIds];
    const prev = initial.store.images.map((img) => img.id);
    return eq(next, prev) ? undefined : next;
}
