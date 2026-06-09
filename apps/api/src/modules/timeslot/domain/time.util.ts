// StoreOperatingHour의 @db.Time(6) 값을 매장 벽시계 분으로 변환한다.

/** db.Time 값(1970-01-01 UTC HH:mm)에서 벽시계 분(0~1439)을 얻는다. */
export function timeColumnToMinutes(value: Date): number {
    return value.getUTCHours() * 60 + value.getUTCMinutes();
}
