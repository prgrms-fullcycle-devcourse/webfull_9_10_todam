export class StoreImagePolicy {
    static readonly MAX_IMAGES = 5;

    static canAdd(currentCount: number): boolean {
        return currentCount < StoreImagePolicy.MAX_IMAGES;
    }
}
