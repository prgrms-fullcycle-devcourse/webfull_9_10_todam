import { businessNumberSchema, emailSchema, phoneSchema, slugSchema } from '@todam/shared';
import { create } from 'zustand';

import { filterValidImageFiles } from '../../../../shared/lib/imageFile';
import type { PendingImage } from '../../../../shared/model';
import {
    MAX_STORE_IMAGES,
    StoreRegistrationStep,
    type ConvenienceState,
    type StoreRegistrationForm,
    type OperatingState,
} from './types';

// 형식 검증 = shared zod 스키마 재사용 (regex 중복 제거)
const ok = (schema: { safeParse: (v: unknown) => { success: boolean } }, v: string) =>
    schema.safeParse(v).success;

function initialForm(): StoreRegistrationForm {
    return {
        business: {
            documentUrl: null,
            businessNumber: '',
            businessName: '',
            ownerName: '',
            email: '',
            businessAddress: '',
            addressDetail: '',
            latitude: null,
            longitude: null,
        },
        store: {
            images: [],
            name: '',
            slug: '',
            phone: '',
            description: '',
            convenienceInfo: { parking: false, pet: false, wifi: false },
            slugChecked: false,
            slugAvailable: false,
        },
        operating: {
            openTime: '10:00',
            closeTime: '18:00',
            breakStart: '',
            breakEnd: '',
            businessDays: [0, 1, 2, 3, 4, 5, 6], // 전체 선택 기본
        },
        reservation: {
            intervalMinutes: 60,
            cancelDeadlineDays: 1,
            maxCapacity: 4,
            autoConfirm: null,
        },
    };
}

type Patch<T> = Partial<T>;

interface StoreRegistrationStore {
    step: StoreRegistrationStep;
    form: StoreRegistrationForm;
    setStep: (step: StoreRegistrationStep) => void;
    next: () => void;
    prev: () => void;
    patchBusiness: (p: Patch<StoreRegistrationForm['business']>) => void;
    setAddress: (address: string, latitude: number, longitude: number) => void;
    patchStore: (p: Patch<StoreRegistrationForm['store']>) => void;
    addImageFiles: (files: File[]) => void;
    removeImage: (index: number) => void;
    toggleConvenience: (key: keyof ConvenienceState) => void;
    patchOperating: (p: Patch<OperatingState>) => void;
    toggleBusinessDay: (day: number) => void;
    patchReservation: (p: Patch<StoreRegistrationForm['reservation']>) => void;
    reset: () => void;
}

export const useStoreRegistrationStore = create<StoreRegistrationStore>((set) => ({
    step: StoreRegistrationStep.Business,
    form: initialForm(),
    setStep: (step) => set({ step }),
    next: () => set((s) => ({ step: Math.min(s.step + 1, StoreRegistrationStep.Reservation) })),
    prev: () => set((s) => ({ step: Math.max(s.step - 1, StoreRegistrationStep.Business) })),
    patchBusiness: (p) =>
        set((s) => ({ form: { ...s.form, business: { ...s.form.business, ...p } } })),
    // 주소 선택: 도로명 + 좌표 세팅, 상세주소는 초기화
    setAddress: (address, latitude, longitude) =>
        set((s) => ({
            form: {
                ...s.form,
                business: {
                    ...s.form.business,
                    businessAddress: address,
                    latitude,
                    longitude,
                    addressDetail: '',
                },
            },
        })),
    patchStore: (p) =>
        set((s) => {
            const store = { ...s.form.store, ...p };
            if (p.slug !== undefined) {
                store.slugChecked = false;
                store.slugAvailable = false;
            }
            return { form: { ...s.form, store } };
        }),
    addImageFiles: (files) =>
        set((s) => {
            const room = MAX_STORE_IMAGES - s.form.store.images.length;
            if (room <= 0) return s;
            const valid = filterValidImageFiles(files).slice(0, room);
            if (valid.length === 0) return s;
            const empty = s.form.store.images.length === 0;
            const added: PendingImage[] = valid.map((file, i) => ({
                file,
                previewUrl: URL.createObjectURL(file),
                isThumbnail: empty && i === 0,
            }));
            return {
                form: {
                    ...s.form,
                    store: { ...s.form.store, images: [...s.form.store.images, ...added] },
                },
            };
        }),
    removeImage: (index) =>
        set((s) => {
            const target = s.form.store.images[index];
            if (target) URL.revokeObjectURL(target.previewUrl);
            return {
                form: {
                    ...s.form,
                    store: {
                        ...s.form.store,
                        images: s.form.store.images.filter((_, i) => i !== index),
                    },
                },
            };
        }),
    toggleConvenience: (key) =>
        set((s) => ({
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
        })),
    patchOperating: (p) =>
        set((s) => ({ form: { ...s.form, operating: { ...s.form.operating, ...p } } })),
    toggleBusinessDay: (day) =>
        set((s) => {
            const has = s.form.operating.businessDays.includes(day);
            const businessDays = has
                ? s.form.operating.businessDays.filter((d) => d !== day)
                : [...s.form.operating.businessDays, day];
            return { form: { ...s.form, operating: { ...s.form.operating, businessDays } } };
        }),
    patchReservation: (p) =>
        set((s) => ({ form: { ...s.form, reservation: { ...s.form.reservation, ...p } } })),
    reset: () =>
        set((s) => {
            s.form.store.images.forEach((p) => URL.revokeObjectURL(p.previewUrl));
            return { step: StoreRegistrationStep.Business, form: initialForm() };
        }),
}));

// ─── 단계별 유효성 (필수값 충족 시 다음/신청 활성) ───────────────
export function isStepValid(form: StoreRegistrationForm, step: StoreRegistrationStep): boolean {
    switch (step) {
        case StoreRegistrationStep.Business: {
            const b = form.business;
            return (
                !!b.documentUrl &&
                ok(businessNumberSchema, b.businessNumber) &&
                b.businessName.trim().length > 0 &&
                b.ownerName.trim().length > 0 &&
                ok(emailSchema, b.email) &&
                b.businessAddress.trim().length > 0 &&
                b.latitude !== null &&
                b.longitude !== null
            );
        }
        case StoreRegistrationStep.StoreInfo: {
            const s = form.store;
            return (
                s.images.length > 0 &&
                s.name.trim().length > 0 &&
                ok(slugSchema, s.slug) &&
                s.slugChecked &&
                s.slugAvailable &&
                ok(phoneSchema, s.phone)
            );
        }
        case StoreRegistrationStep.Operating: {
            const o = form.operating;
            if (!o.openTime || !o.closeTime || o.openTime >= o.closeTime) return false;
            if (o.businessDays.length === 0) return false;
            // 휴식은 선택. 입력 시 둘 다 + start<end
            if (o.breakStart || o.breakEnd) {
                if (!o.breakStart || !o.breakEnd || o.breakStart >= o.breakEnd) return false;
            }
            return true;
        }
        case StoreRegistrationStep.Reservation: {
            const r = form.reservation;
            return (
                r.intervalMinutes > 0 &&
                r.maxCapacity > 0 &&
                r.cancelDeadlineDays >= 0 &&
                r.autoConfirm !== null
            );
        }
        default:
            return false;
    }
}

// 이탈 가드용 dirty: 초기 폼(기본값)과 1바이트라도 다르면 작성 중으로 간주.
export function isDirty(form: StoreRegistrationForm): boolean {
    return JSON.stringify(form) !== JSON.stringify(initialForm());
}

export function isAllValid(form: StoreRegistrationForm): boolean {
    return (
        isStepValid(form, StoreRegistrationStep.Business) &&
        isStepValid(form, StoreRegistrationStep.StoreInfo) &&
        isStepValid(form, StoreRegistrationStep.Operating) &&
        isStepValid(form, StoreRegistrationStep.Reservation)
    );
}
