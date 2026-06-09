// 타임슬롯 생성 후보 계산 — 순수 도메인 규칙(DB/Nest 비의존).
// 영업시간·interval·생성 범위·현재시각만 입력받아 생성 후보 격자를 계산한다.
// (멱등 생성·prune 등 영속 부수효과는 repository 가 담당. 여기는 계산만.)

import {
    eachDateInclusive,
    kstDayOfWeek,
    kstWallClockToInstant,
} from '../../../../common/date/kst-date.util';
import { timeColumnToMinutes } from '../time.util';

/** 요일별 영업시간 입력(Prisma 타입 비의존 — db.Time 은 Date 로 표현). */
export interface OperatingHourInput {
    dayOfWeek: string;
    openTime: Date;
    closeTime: Date;
    breakStart: Date | null;
    breakEnd: Date | null;
}

export interface SlotCandidate {
    startAt: Date;
    endAt: Date;
}

export interface BuildCandidatesInput {
    interval: number;
    operatingHours: OperatingHourInput[];
    startParts: { year: number; month: number; day: number };
    endParts: { year: number; month: number; day: number };
    /** 현재 시각(epoch ms). 이 시각 이하로 시작하는 슬롯은 과거로 스킵. */
    now: number;
}

export interface BuildCandidatesResult {
    candidates: SlotCandidate[];
    pastSkipped: number;
    /** 생성 범위 내 운영 요일이 하나라도 매칭됐는지(없으면 use-case 가 409). */
    anyOperatingDay: boolean;
}

export class TimeSlotGenerationService {
    /**
     * 생성 후보 슬롯 격자를 계산한다.
     * - 운영시간 미설정 요일은 정기휴무로 스킵.
     * - break 구간은 하루를 [open, breakStart] / [breakEnd, close] 세그먼트로 분할,
     *   각 세그먼트 시작점부터 back-to-back(interval) 격자를 깐다.
     * - 과거(now 이하) 시작 슬롯은 pastSkipped 로 카운트만 하고 제외.
     */
    static buildCandidates(input: BuildCandidatesInput): BuildCandidatesResult {
        const { interval, operatingHours, startParts, endParts, now } = input;

        const hoursByDay = new Map<string, OperatingHourInput>();
        for (const h of operatingHours) {
            hoursByDay.set(h.dayOfWeek, h);
        }

        const dates = eachDateInclusive(startParts, endParts);
        const candidates: SlotCandidate[] = [];
        let pastSkipped = 0;

        for (const parts of dates) {
            const dow = kstDayOfWeek(parts);
            const hour = hoursByDay.get(dow);
            if (!hour) continue; // 정기휴무(운영시간 미설정 요일).

            const openMin = timeColumnToMinutes(hour.openTime);
            const closeMin = timeColumnToMinutes(hour.closeTime);
            const breakStartMin = hour.breakStart ? timeColumnToMinutes(hour.breakStart) : null;
            const breakEndMin = hour.breakEnd ? timeColumnToMinutes(hour.breakEnd) : null;
            const hasBreak =
                breakStartMin != null &&
                breakEndMin != null &&
                breakStartMin < breakEndMin &&
                breakStartMin >= openMin &&
                breakEndMin <= closeMin;

            // break 는 하루를 구간으로 분할한다. 각 구간은 그 구간 시작점부터 back-to-back 격자.
            const segments: [number, number][] = hasBreak
                ? [
                      [openMin, breakStartMin!],
                      [breakEndMin!, closeMin],
                  ]
                : [[openMin, closeMin]];

            for (const [segStart, segEnd] of segments) {
                for (
                    let slotStart = segStart;
                    slotStart + interval <= segEnd;
                    slotStart += interval
                ) {
                    const slotEnd = slotStart + interval;
                    const startAt = kstWallClockToInstant(parts, slotStart);
                    const endAt = kstWallClockToInstant(parts, slotEnd);

                    if (startAt.getTime() <= now) {
                        pastSkipped += 1;
                        continue;
                    }
                    candidates.push({ startAt, endAt });
                }
            }
        }

        const anyOperatingDay = dates.some((parts) => hoursByDay.has(kstDayOfWeek(parts)));

        return { candidates, pastSkipped, anyOperatingDay };
    }
}
