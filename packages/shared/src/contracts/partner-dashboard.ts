import { z } from 'zod';
import { StoreStatus } from '../enums/store-status';

export const partnerDashboardStoreItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    ownerName: z.string(),
    status: z.nativeEnum(StoreStatus),
    todayReservationCount: z.number().int().nonnegative(),
    createdAt: z.string(),
});
export type PartnerDashboardStoreItem = z.infer<typeof partnerDashboardStoreItemSchema>;

export const partnerDashboardStoresResultSchema = z.object({
    stores: z.array(partnerDashboardStoreItemSchema),
});
export type PartnerDashboardStoresResult = z.infer<typeof partnerDashboardStoresResultSchema>;
