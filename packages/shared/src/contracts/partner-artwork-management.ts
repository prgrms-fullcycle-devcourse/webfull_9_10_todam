import { z } from 'zod';

import { ArtworkStatus } from '../enums/artwork-status';
import { ReservationDeliveryMethod } from '../enums/reservation-delivery-method';
import { displayStateSchema } from './reservation-list';

export const ArtworkStatusGroup = {
    WAITING: 'WAITING',
    IN_PROGRESS: 'IN_PROGRESS',
    RECEIVING: 'RECEIVING',
    RECEIVED: 'RECEIVED',
} as const;
export type ArtworkStatusGroup = (typeof ArtworkStatusGroup)[keyof typeof ArtworkStatusGroup];

export const ArtworkDetailStatus = {
    RESERVED: 'RESERVED',
    VISITED: 'VISITED',
    DRYING: 'DRYING',
    BISQUE_FIRING: 'BISQUE_FIRING',
    GLAZING: 'GLAZING',
    GLAZE_FIRING: 'GLAZE_FIRING',
    DELIVERY_READY: 'DELIVERY_READY',
    SHIPPED: 'SHIPPED',
    PICKUP_READY: 'PICKUP_READY',
    DELIVERED: 'DELIVERED',
    PICKUP_DONE: 'PICKUP_DONE',
} as const;
export type ArtworkDetailStatus = (typeof ArtworkDetailStatus)[keyof typeof ArtworkDetailStatus];

export const ArtworkAvailableAction = {
    UPDATE_STATUS: 'UPDATE_STATUS',
    SHIP: 'SHIP',
    PICKUP_READY: 'PICKUP_READY',
    PICKUP_DONE: 'PICKUP_DONE',
    DELIVERED: 'DELIVERED',
} as const;
export type ArtworkAvailableAction =
    (typeof ArtworkAvailableAction)[keyof typeof ArtworkAvailableAction];

const artworkStatusGroupSchema = z.enum(['WAITING', 'IN_PROGRESS', 'RECEIVING', 'RECEIVED']);
const artworkDetailStatusSchema = z.enum([
    'RESERVED',
    'VISITED',
    'DRYING',
    'BISQUE_FIRING',
    'GLAZING',
    'GLAZE_FIRING',
    'DELIVERY_READY',
    'SHIPPED',
    'PICKUP_READY',
    'DELIVERED',
    'PICKUP_DONE',
]);
const artworkAvailableActionSchema = z.enum([
    'UPDATE_STATUS',
    'SHIP',
    'PICKUP_READY',
    'PICKUP_DONE',
    'DELIVERED',
]);
const artworkStatusValueSchema = z.enum([
    'RESERVED',
    'VISITED',
    'DRYING',
    'BISQUE_FIRING',
    'GLAZING',
    'GLAZE_FIRING',
    'COMPLETED',
    'CANCELED',
]);
const reservationStatusValueSchema = z.enum([
    'PENDING',
    'CONFIRMED',
    'CANCELED',
    'IN_PROGRESS',
    'SHIPPED',
    'DELIVERED',
    'PICKUP_READY',
    'PICKUP_DONE',
]);
const reservationDeliveryMethodValueSchema = z.enum(['DELIVERY', 'PICKUP']);

export const listPartnerArtworksQuerySchema = z.object({
    status: z.nativeEnum(ArtworkStatus).optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListPartnerArtworksQuery = z.infer<typeof listPartnerArtworksQuerySchema>;

export const listPartnerArtworksResultSchema = z.object({
    artworks: z.array(
        z.object({
            id: z.string(),
            reserverName: z.string(),
            status: artworkStatusValueSchema,
            estimatedCompletedAt: z.string().nullable(),
            thumbnailUrl: z.string().nullable(),
            updatedAt: z.string(),
            scheduledAt: z.string(),
            programTitle: z.string(),
            participantCount: z.number().int(),
            deliveryMethod: reservationDeliveryMethodValueSchema,
            reservationStatus: reservationStatusValueSchema,
            statusGroup: artworkStatusGroupSchema.nullable(),
            detailStatus: artworkDetailStatusSchema.nullable(),
        }),
    ),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
});
export type ListPartnerArtworksResult = z.infer<typeof listPartnerArtworksResultSchema>;

export const countPartnerArtworksQuerySchema = z.object({
    storeId: z.string().optional(),
    group: z.enum(['WAITING', 'IN_PROGRESS', 'RECEIVING', 'RECEIVED']).optional(),
});
export type CountPartnerArtworksQuery = z.infer<typeof countPartnerArtworksQuerySchema>;

export const countPartnerArtworksResultSchema = z.object({
    group: artworkStatusGroupSchema.nullable(),
    total: z.number().int().nonnegative(),
    steps: z.record(z.string(), z.number().int().nonnegative()),
});
export type CountPartnerArtworksResult = z.infer<typeof countPartnerArtworksResultSchema>;

export const updateArtworkStatusRequestSchema = z.object({
    status: z.nativeEnum(ArtworkStatus),
    memo: z.string().max(1000).optional(),
});
export type UpdateArtworkStatusRequest = z.infer<typeof updateArtworkStatusRequestSchema>;

export const updateArtworkStatusResultSchema = z.object({
    artwork: z.object({
        id: z.string(),
        status: artworkStatusValueSchema,
        updatedAt: z.string(),
    }),
});
export type UpdateArtworkStatusResult = z.infer<typeof updateArtworkStatusResultSchema>;

export const bulkUpdateArtworkStatusRequestSchema = z.object({
    artworkIds: z.array(z.string()).min(1).max(50),
    fromStatus: z.nativeEnum(ArtworkStatus),
    toStatus: z.nativeEnum(ArtworkStatus),
});
export type BulkUpdateArtworkStatusRequest = z.infer<typeof bulkUpdateArtworkStatusRequestSchema>;

export const bulkUpdateArtworkStatusResultSchema = z.object({
    updatedCount: z.number().int().nonnegative(),
    status: artworkStatusValueSchema,
});
export type BulkUpdateArtworkStatusResult = z.infer<typeof bulkUpdateArtworkStatusResultSchema>;

export const createArtworkPhotosRequestSchema = z.object({
    artworkLogId: z.string(),
    files: z
        .array(
            z.object({
                filename: z.string().min(1).max(255),
                fileSize: z
                    .number()
                    .int()
                    .positive()
                    .max(5 * 1024 * 1024),
                contentType: z.enum(['image/jpeg', 'image/png', 'image/heic']),
            }),
        )
        .min(1)
        .max(5),
});
export type CreateArtworkPhotosRequest = z.infer<typeof createArtworkPhotosRequestSchema>;

export const createArtworkPhotosResultSchema = z.object({
    photos: z.array(
        z.object({
            photoId: z.string(),
            uploadUrl: z.string(),
            imageUrl: z.string(),
        }),
    ),
});
export type CreateArtworkPhotosResult = z.infer<typeof createArtworkPhotosResultSchema>;

export const confirmArtworkPhotoResultSchema = z.object({
    photo: z.object({
        id: z.string(),
        status: z.string(),
    }),
});
export type ConfirmArtworkPhotoResult = z.infer<typeof confirmArtworkPhotoResultSchema>;

export const deleteArtworkPhotoResultSchema = z.object({
    deletedPhotoId: z.string(),
});
export type DeleteArtworkPhotoResult = z.infer<typeof deleteArtworkPhotoResultSchema>;

export const DeliveryCarrier = {
    CJ_LOGISTICS: 'CJ_LOGISTICS',
    LOTTE: 'LOTTE',
    HANJIN: 'HANJIN',
    KOREA_POST: 'KOREA_POST',
    LOGEN: 'LOGEN',
    COUPANG_LOGISTICS: 'COUPANG_LOGISTICS',
} as const;

const carrierSchema = z.enum([
    'CJ_LOGISTICS',
    'LOTTE',
    'HANJIN',
    'KOREA_POST',
    'LOGEN',
    'COUPANG_LOGISTICS',
]);

const artworkDeliverySchema = z.object({
    id: z.string(),
    recipientName: z.string().nullable(),
    recipientPhone: z.string().nullable(),
    postalCode: z.string().nullable(),
    address: z.string().nullable(),
    addressDetail: z.string().nullable(),
    trackingNumber: z.string().nullable(),
    carrier: z.string().nullable(),
    shippedAt: z.string().nullable(),
});

const artworkPhotoSchema = z.object({
    id: z.string(),
    thumbnailUrl: z.string().nullable(),
    imageUrl: z.string(),
});

export const getPartnerArtworkDetailResultSchema = z.object({
    artwork: z.object({
        id: z.string(),
        reservationId: z.string(),
        reserverName: z.string(),
        status: artworkStatusValueSchema,
        displayState: displayStateSchema,
        internalMemo: z.string().nullable(),
        estimatedCompletedAt: z.string().nullable(),
        elapsedDays: z.number().int().nonnegative(),
        artworkLogId: z.string().nullable(),
        currentStagePhotos: z.array(artworkPhotoSchema),
        logs: z.array(
            z.object({
                id: z.string(),
                fromStatus: artworkStatusValueSchema.nullable(),
                toStatus: artworkStatusValueSchema,
                changedByNickname: z.string(),
                memo: z.string().nullable(),
                createdAt: z.string(),
            }),
        ),
        deliveryMethod: reservationDeliveryMethodValueSchema,
        delivery: artworkDeliverySchema.nullable(),
        timeline: z.array(
            z.object({
                stage: artworkStatusValueSchema,
                state: z.enum(['CURRENT', 'COMPLETED', 'UPCOMING']),
                changedAt: z.string().nullable(),
                photos: z.array(artworkPhotoSchema),
            }),
        ),
        reservation: z.object({
            id: z.string(),
            reservationNumber: z.string(),
            programTitle: z.string(),
            scheduledAt: z.string(),
            participantCount: z.number().int(),
            reserverName: z.string(),
            reserverPhone: z.string(),
            internalMemo: z.string().nullable(),
        }),
        availableAction: z.array(artworkAvailableActionSchema),
    }),
});
export type GetPartnerArtworkDetailResult = z.infer<typeof getPartnerArtworkDetailResultSchema>;

export const updateArtworkDeliveryInfoRequestSchema = z
    .object({
        deliveryMethod: z.nativeEnum(ReservationDeliveryMethod),
        recipientName: z.string().max(100).optional(),
        recipientPhone: z.string().max(20).optional(),
        postalCode: z.string().max(10).optional(),
        address: z.string().max(500).optional(),
        addressDetail: z.string().max(200).optional(),
        carrier: carrierSchema.optional(),
        trackingNumber: z
            .string()
            .regex(/^\d{5,100}$/)
            .optional(),
    })
    .superRefine((value, ctx) => {
        if (value.deliveryMethod === ReservationDeliveryMethod.DELIVERY) {
            for (const field of [
                'recipientName',
                'recipientPhone',
                'postalCode',
                'address',
            ] as const) {
                if (!value[field]) {
                    ctx.addIssue({
                        code: 'custom',
                        path: [field],
                        message: `${field} is required.`,
                    });
                }
            }
        }
    });
export type UpdateArtworkDeliveryInfoRequest = z.infer<
    typeof updateArtworkDeliveryInfoRequestSchema
>;

export const updateArtworkDeliveryInfoResultSchema = z.object({
    deliveryMethod: reservationDeliveryMethodValueSchema,
    delivery: artworkDeliverySchema.nullable(),
});
export type UpdateArtworkDeliveryInfoResult = z.infer<typeof updateArtworkDeliveryInfoResultSchema>;

export const updateArtworkDeliveryRequestSchema = z.discriminatedUnion('action', [
    z.object({
        action: z.literal('SHIP'),
        trackingNumber: z.string().regex(/^\d{5,100}$/),
        carrier: carrierSchema,
        shippedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
    z.object({ action: z.literal('PICKUP_READY') }),
    z.object({ action: z.literal('PICKUP_DONE') }),
    z.object({ action: z.literal('DELIVERED') }),
]);
export type UpdateArtworkDeliveryRequest = z.infer<typeof updateArtworkDeliveryRequestSchema>;

export const updateArtworkDeliveryResultSchema = z.object({
    reservation: z.object({
        id: z.string(),
        status: reservationStatusValueSchema,
        trackingNumber: z.string().nullable(),
        carrier: z.string().nullable(),
        shippedAt: z.string().nullable(),
    }),
});
export type UpdateArtworkDeliveryResult = z.infer<typeof updateArtworkDeliveryResultSchema>;
