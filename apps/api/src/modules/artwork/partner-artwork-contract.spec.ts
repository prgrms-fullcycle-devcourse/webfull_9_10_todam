import {
    createArtworkPhotosResultSchema,
    getPartnerArtworkDetailResultSchema,
    listPartnerArtworksResultSchema,
} from '@todam/shared';

describe('partner artwork shared contracts', () => {
    it('accepts the partner artwork list response shape', () => {
        expect(
            listPartnerArtworksResultSchema.safeParse({
                artworks: [
                    {
                        id: 'artwork-1',
                        reserverName: 'Todam',
                        status: 'DRYING',
                        estimatedCompletedAt: null,
                        thumbnailUrl: null,
                        updatedAt: '2026-06-08T00:00:00.000Z',
                        scheduledAt: '2026-06-01T00:00:00.000Z',
                        programTitle: 'Pottery',
                        participantCount: 1,
                        deliveryMethod: 'PICKUP',
                        reservationStatus: 'IN_PROGRESS',
                        statusGroup: 'IN_PROGRESS',
                        detailStatus: 'DRYING',
                    },
                ],
                nextCursor: null,
                hasMore: false,
            }).success,
        ).toBe(true);
    });

    it('accepts the shared artwork photo upload response shape', () => {
        expect(
            createArtworkPhotosResultSchema.safeParse({
                photos: [
                    {
                        photoId: 'photo-1',
                        uploadUrl: 'https://s3.example.com/upload',
                        imageUrl: 'https://cdn.example.com/photo-1.jpg',
                    },
                ],
            }).success,
        ).toBe(true);
    });

    it('accepts the partner artwork detail response shape', () => {
        expect(
            getPartnerArtworkDetailResultSchema.safeParse({
                artwork: {
                    id: 'artwork-1',
                    reservationId: 'reservation-1',
                    reserverName: 'Todam',
                    status: 'VISITED',
                    displayState: {
                        label: 'WAITING',
                        description: 'VISITED',
                        subLabel: 'VISITED',
                    },
                    internalMemo: null,
                    estimatedCompletedAt: null,
                    elapsedDays: 1,
                    artworkLogId: 'log-1',
                    currentStagePhotos: [],
                    logs: [],
                    deliveryMethod: 'PICKUP',
                    delivery: null,
                    timeline: [],
                    reservation: {
                        id: 'reservation-1',
                        reservationNumber: 'reservation-1',
                        programTitle: 'Pottery',
                        scheduledAt: '2026-06-08T00:00:00.000Z',
                        participantCount: 1,
                        reserverName: 'Todam',
                        reserverPhone: '010-0000-0000',
                        internalMemo: null,
                    },
                    availableAction: ['UPDATE_STATUS'],
                },
            }).success,
        ).toBe(true);
    });
});
