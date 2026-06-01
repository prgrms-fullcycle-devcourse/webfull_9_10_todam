import {
    DAY_OF_WEEK,
    type GeocodeResult,
    type StoreRegistrationStatusResult,
    type StoreRegistrationSubmitRequest,
    type StoreRegistrationSubmitResult,
    type SlugAvailabilityResult,
} from '@todam/shared';

import { apiFetch } from '../../../shared/api';

import type { StoreRegistrationForm } from './model/types';

const BASE = '/api/v1/partner';

export function checkSlug(slug: string) {
    return apiFetch<SlugAvailabilityResult>(
        `${BASE}/stores/slug-availability?slug=${encodeURIComponent(slug)}`,
        { method: 'GET' },
    );
}

// 주소 → 좌표. (실연동: 카카오 로컬 API. 현재 mock)
export function geocode(query: string) {
    return apiFetch<GeocodeResult>(`/api/v1/geocode?query=${encodeURIComponent(query)}`, {
        method: 'GET',
    });
}

export function submitStoreRegistration(form: StoreRegistrationForm) {
    const fullAddress = `${form.business.businessAddress} ${form.business.addressDetail}`.trim();
    const body: StoreRegistrationSubmitRequest = {
        name: form.store.name,
        slug: form.store.slug,
        description: form.store.description,
        phone: form.store.phone,
        address: fullAddress,
        latitude: form.business.latitude ?? 0,
        longitude: form.business.longitude ?? 0,
        convenienceInfo: { ...form.store.convenienceInfo },
        images: [...form.store.images],
        autoConfirm: form.reservation.autoConfirm ?? false,
        reservationIntervalMinutes: form.reservation.intervalMinutes,
        cancelDeadlineDays: form.reservation.cancelDeadlineDays,
        maxCapacityPerSlot: form.reservation.maxCapacity,
        operatingHours: [...form.operating.businessDays]
            .sort((a, b) => a - b)
            .map((day) => ({
                dayOfWeek: DAY_OF_WEEK[day]!,
                openTime: form.operating.openTime,
                closeTime: form.operating.closeTime,
                breakStart: form.operating.breakStart || null,
                breakEnd: form.operating.breakEnd || null,
            })),
        // TODO(presigned 후행): form.store.images → imageKeys 전송
        businessDocument: {
            documentUrl: form.business.documentUrl ?? '',
            ownerName: form.business.ownerName,
            businessName: form.business.businessName,
            businessNumber: form.business.businessNumber,
            businessAddress: fullAddress,
            email: form.business.email,
        },
    };
    return apiFetch<StoreRegistrationSubmitResult>(`${BASE}/onboarding`, { method: 'POST', body });
}

export function getStoreRegistrationStatus(preview?: 'rejected') {
    const q = preview ? `?preview=${preview}` : '';
    return apiFetch<StoreRegistrationStatusResult>(`${BASE}/onboarding${q}`, { method: 'GET' });
}
