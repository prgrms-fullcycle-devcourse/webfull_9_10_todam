import { DAY_OF_WEEK, toKstWallClock } from '../../../../common/date/kst-date.util';

const EARTH_RADIUS_M = 6_371_000;

export interface StoreCoordinates {
    latitude: number | null;
    longitude: number | null;
}

export interface StoreProgramPrice {
    id: string;
    price: number;
    sortOrder: number;
}

export interface StoreOperatingHour {
    dayOfWeek: string;
    openTime: Date;
    closeTime: Date;
    breakStart: Date | null;
    breakEnd: Date | null;
}

export class StoreListPolicy {
    static distanceMeters(lat: number, lng: number, store: StoreCoordinates): number {
        if (store.latitude === null || store.longitude === null) {
            return Number.POSITIVE_INFINITY;
        }

        const toRad = (degrees: number): number => (degrees * Math.PI) / 180;
        const dLat = toRad(store.latitude - lat);
        const dLng = toRad(store.longitude - lng);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat)) * Math.cos(toRad(store.latitude)) * Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(EARTH_RADIUS_M * c);
    }

    static cheapest<T extends StoreProgramPrice>(programs: T[]): T {
        const first = [...programs].sort((a, b) => {
            if (a.price !== b.price) return a.price - b.price;
            if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
            return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
        })[0];

        if (!first) {
            throw new Error('cheapest: programs must not be empty');
        }
        return first;
    }

    static isOperating(hours: StoreOperatingHour[], now = new Date()): boolean {
        const nowKst = toKstWallClock(now);
        const day = DAY_OF_WEEK[nowKst.getUTCDay()];
        const nowMinutes = nowKst.getUTCHours() * 60 + nowKst.getUTCMinutes();

        return hours
            .filter((hour) => hour.dayOfWeek === day)
            .some((hour) => {
                const open = this.timeToMinutes(hour.openTime);
                const close = this.timeToMinutes(hour.closeTime);
                if (open === null || close === null) return false;
                const withinOpen =
                    close > open
                        ? nowMinutes >= open && nowMinutes < close
                        : nowMinutes >= open || nowMinutes < close;
                if (!withinOpen) return false;

                const breakStart = this.timeToMinutes(hour.breakStart);
                const breakEnd = this.timeToMinutes(hour.breakEnd);
                return !(
                    breakStart !== null &&
                    breakEnd !== null &&
                    nowMinutes >= breakStart &&
                    nowMinutes < breakEnd
                );
            });
    }

    private static timeToMinutes(time: Date | null): number | null {
        return time ? time.getUTCHours() * 60 + time.getUTCMinutes() : null;
    }
}
