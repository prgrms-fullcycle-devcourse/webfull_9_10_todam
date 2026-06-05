import { parseStoreTime } from './time.util';

describe('parseStoreTime', () => {
    it('converts HH:mm to a UTC time value', () => {
        const value = parseStoreTime('09:30');

        expect(value.getUTCHours()).toBe(9);
        expect(value.getUTCMinutes()).toBe(30);
        expect(value.getUTCSeconds()).toBe(0);
    });
});
