export function parseStoreTime(hhmm: string): Date {
    const [hours, minutes] = hhmm.split(':').map(Number);
    const date = new Date(0);
    date.setUTCHours(hours!, minutes!, 0, 0);
    return date;
}
