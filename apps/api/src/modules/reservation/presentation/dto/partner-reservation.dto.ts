import {
    calendarDataSchema,
    cancelPartnerReservationRequestSchema,
    createPartnerReservationResponseSchema,
    createPartnerReservationRequestSchema,
    listPartnerReservationsQuerySchema,
    partnerReservationCalendarQuerySchema,
    partnerReservationDetailResponseSchema,
    partnerReservationStatusResponseSchema,
    reservationListDataSchema,
    rejectPartnerReservationRequestSchema,
} from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class PartnerReservationCalendarQueryDto extends createZodDto(
    partnerReservationCalendarQuerySchema,
) {}

export class PartnerReservationCalendarResponseDto extends createZodDto(calendarDataSchema) {}

export class ListPartnerReservationsQueryDto extends createZodDto(
    listPartnerReservationsQuerySchema,
) {}

export class ListPartnerReservationsResponseDto extends createZodDto(reservationListDataSchema) {}

export class GetPartnerReservationDetailResponseDto extends createZodDto(
    partnerReservationDetailResponseSchema,
) {}

export class PartnerReservationStatusResponseDto extends createZodDto(
    partnerReservationStatusResponseSchema,
) {}

// 요청 SSOT = @todam/shared(zod). 검증은 컨트롤러 param ZodValidationPipe.
export class CancelPartnerReservationDto extends createZodDto(
    cancelPartnerReservationRequestSchema,
) {}

export class RejectPartnerReservationDto extends createZodDto(
    rejectPartnerReservationRequestSchema,
) {}

export class CreatePartnerReservationDto extends createZodDto(
    createPartnerReservationRequestSchema,
) {}

export class CreatePartnerReservationResponseDto extends createZodDto(
    createPartnerReservationResponseSchema,
) {}
