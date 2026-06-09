import { z } from 'zod';

export const PartnerTerminationErrorCode = {
    ACTIVE_RESERVATIONS_OR_ARTWORKS_EXIST: 'ACTIVE_RESERVATIONS_OR_ARTWORKS_EXIST',
    PARTNER_NOT_FOUND: 'PARTNER_NOT_FOUND',
} as const;
export type PartnerTerminationErrorCode =
    (typeof PartnerTerminationErrorCode)[keyof typeof PartnerTerminationErrorCode];

export const terminatePartnerResultSchema = z.null();
export type TerminatePartnerResult = z.infer<typeof terminatePartnerResultSchema>;
