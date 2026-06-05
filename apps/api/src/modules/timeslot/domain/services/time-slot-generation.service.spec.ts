import { OperatingHourInput, TimeSlotGenerationService } from './time-slot-generation.service';

// db.Time 컬럼은 1970-01-01 UTC HH:mm = KST 벽시계 HH:mm 규약.
const time = (h: number, m = 0): Date => new Date(Date.UTC(1970, 0, 1, h, m));

const ALL_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function hoursForAllDays(partial: Omit<OperatingHourInput, 'dayOfWeek'>): OperatingHourInput[] {
    return ALL_DAYS.map((dayOfWeek) => ({ dayOfWeek, ...partial }));
}

// 과거 스킵을 끄기 위한 충분히 이른 기준시각.
const PAST_NOW = Date.UTC(2000, 0, 1);

describe('TimeSlotGenerationService.buildCandidates', () => {
    const day = { year: 2026, month: 6, day: 10 }; // 단일 날짜

    it('영업시간을 interval 격자로 back-to-back 생성한다', () => {
        const result = TimeSlotGenerationService.buildCandidates({
            interval: 60,
            operatingHours: hoursForAllDays({
                openTime: time(10),
                closeTime: time(12),
                breakStart: null,
                breakEnd: null,
            }),
            startParts: day,
            endParts: day,
            now: PAST_NOW,
        });

        expect(result.anyOperatingDay).toBe(true);
        expect(result.candidates).toHaveLength(2);
        // 10:00 KST → 01:00Z
        expect(result.candidates[0]!.startAt.toISOString()).toBe('2026-06-10T01:00:00.000Z');
        expect(result.candidates[1]!.startAt.toISOString()).toBe('2026-06-10T02:00:00.000Z');
    });

    it('break 구간은 세그먼트로 분할되어 제외된다', () => {
        const result = TimeSlotGenerationService.buildCandidates({
            interval: 60,
            operatingHours: hoursForAllDays({
                openTime: time(10),
                closeTime: time(13),
                breakStart: time(11),
                breakEnd: time(12),
            }),
            startParts: day,
            endParts: day,
            now: PAST_NOW,
        });

        // [10,11] 한 칸 + [12,13] 한 칸. 11~12(break)는 제외.
        expect(result.candidates).toHaveLength(2);
        expect(result.candidates.map((c) => c.startAt.toISOString())).toEqual([
            '2026-06-10T01:00:00.000Z', // 10:00 KST
            '2026-06-10T03:00:00.000Z', // 12:00 KST
        ]);
    });

    it('now 이하로 시작하는 과거 슬롯은 pastSkipped 로 제외된다', () => {
        // 11:00 KST(=02:00Z) 까지 과거로 간주.
        const now = Date.parse('2026-06-10T02:00:00.000Z');
        const result = TimeSlotGenerationService.buildCandidates({
            interval: 60,
            operatingHours: hoursForAllDays({
                openTime: time(10),
                closeTime: time(12),
                breakStart: null,
                breakEnd: null,
            }),
            startParts: day,
            endParts: day,
            now,
        });

        // 10:00(01:00Z) 슬롯은 과거, 11:00(02:00Z) 슬롯도 now 이하 → 둘 다 스킵.
        expect(result.pastSkipped).toBe(2);
        expect(result.candidates).toHaveLength(0);
    });

    it('운영시간 미설정이면 anyOperatingDay=false (use-case 409 트리거)', () => {
        const result = TimeSlotGenerationService.buildCandidates({
            interval: 60,
            operatingHours: [],
            startParts: day,
            endParts: day,
            now: PAST_NOW,
        });

        expect(result.anyOperatingDay).toBe(false);
        expect(result.candidates).toHaveLength(0);
    });
});
