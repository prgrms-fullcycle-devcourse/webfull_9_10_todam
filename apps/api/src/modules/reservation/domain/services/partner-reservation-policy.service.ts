import { ReservationStatus } from '@prisma/client';

export class PartnerReservationPolicy {
    static canConfirm(status: ReservationStatus): boolean {
        return status === ReservationStatus.PENDING;
    }

    static canReject(status: ReservationStatus): boolean {
        return status === ReservationStatus.PENDING;
    }

    static canCancel(status: ReservationStatus): boolean {
        return status === ReservationStatus.PENDING || status === ReservationStatus.CONFIRMED;
    }

    static canComplete(status: ReservationStatus, scheduledAt: Date, now: Date): boolean {
        return status === ReservationStatus.CONFIRMED && scheduledAt.getTime() <= now.getTime();
    }

    static shouldMaskReserver(status: ReservationStatus): boolean {
        return status === ReservationStatus.CANCELED;
    }

    static maskName(name: string): string {
        const chars = Array.from(name);
        if (chars.length === 0) return '';
        return `${chars[0]}**`;
    }

    static maskPhone(phone: string): string {
        const digits = phone.replace(/\D/g, '');
        if (digits.length >= 7) {
            return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
        }
        return '***';
    }
}
