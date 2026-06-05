import type { StoreStatus } from '@todam/shared/src/enums/store-status';

export class StoreSubmission {
    constructor(
        readonly id: string,
        readonly status: `${StoreStatus}`,
        readonly name: string | null,
        readonly address: string | null,
        readonly hasUploadedThumbnail: boolean,
    ) {}

    isSubmittable(): boolean {
        return this.status === 'DRAFT' || this.status === 'REJECTED';
    }

    missingRequiredFields(): string[] {
        const missing: string[] = [];
        if (!this.name) missing.push('name');
        if (!this.address) missing.push('address');
        if (!this.hasUploadedThumbnail) missing.push('thumbnail image');
        return missing;
    }
}
