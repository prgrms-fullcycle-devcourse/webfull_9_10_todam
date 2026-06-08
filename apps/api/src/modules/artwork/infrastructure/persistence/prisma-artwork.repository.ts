import { HttpStatus, Injectable } from '@nestjs/common';
import {
    ArtworkStatus,
    ImageUploadStatus,
    NotificationStatus,
    NotificationType,
    Prisma,
    ReservationDeliveryMethod,
    ReservationStatus,
} from '@prisma/client';
import type {
    BulkUpdateArtworkStatusRequest,
    BulkUpdateArtworkStatusResult,
    ConfirmArtworkPhotoResult,
    CountPartnerArtworksQuery,
    CountPartnerArtworksResult,
    CreateArtworkPhotosRequest,
    CreateArtworkPhotosResult,
    DeleteArtworkPhotoResult,
    GetPartnerArtworkDetailResult,
    ListPartnerArtworksQuery,
    ListPartnerArtworksResult,
    UpdateArtworkDeliveryInfoRequest,
    UpdateArtworkDeliveryInfoResult,
    UpdateArtworkDeliveryRequest,
    UpdateArtworkDeliveryResult,
    UpdateArtworkStatusRequest,
    UpdateArtworkStatusResult,
    ArtworkAvailableAction,
} from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { buildObjectKey, CDN_BASE, keyFromImageUrl } from '../../../../common/s3/s3-object.util';
import { S3Service } from '../../../../common/s3/s3.service';
import { PrismaService } from '../../../../database/prisma.service';
import { StoreOwnershipService } from '../../../../common/access/store-ownership.service';
import { ArtworkRepository } from '../../domain/repositories/artwork.repository';
import { ARTWORK_SEQUENCE, ArtworkPolicy } from '../../domain/services/artwork-policy.service';

const TERMINAL_RESERVATION_STATUSES = [
    ReservationStatus.SHIPPED,
    ReservationStatus.DELIVERED,
    ReservationStatus.PICKUP_READY,
    ReservationStatus.PICKUP_DONE,
];

type ArtworkLogWithUserPhotos = Prisma.ArtworkLogGetPayload<{
    include: {
        user: { select: { nickname: true } };
        photos: true;
    };
}>;

@Injectable()
export class PrismaArtworkRepository extends ArtworkRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly ownership: StoreOwnershipService,
        private readonly s3: S3Service,
    ) {
        super();
    }

    async list(
        userId: string,
        storeId: string,
        query: ListPartnerArtworksQuery,
    ): Promise<ListPartnerArtworksResult> {
        await this.ownership.verify(userId, storeId);
        const rows = await this.prisma.artwork.findMany({
            where: {
                reservation: { storeId, status: { not: ReservationStatus.CANCELED } },
                status: query.status ? query.status : { not: ArtworkStatus.CANCELED },
            },
            orderBy: [{ reservation: { scheduledAt: 'desc' } }, { id: 'desc' }],
            cursor: query.cursor ? { id: query.cursor } : undefined,
            skip: query.cursor ? 1 : 0,
            take: query.limit + 1,
            include: {
                reservation: { include: { program: { select: { title: true } } } },
                logs: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        photos: {
                            where: { status: ImageUploadStatus.UPLOADED },
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                        },
                    },
                },
            },
        });
        const hasMore = rows.length > query.limit;
        const page = hasMore ? rows.slice(0, query.limit) : rows;
        return {
            artworks: page.map((row) => {
                const view = ArtworkPolicy.statusView(
                    row.status,
                    row.reservation.status,
                    row.reservation.deliveryMethod,
                );
                return {
                    id: row.id,
                    reserverName: row.reservation.reserverName,
                    status: row.status,
                    estimatedCompletedAt: row.estimatedCompletedAt?.toISOString() ?? null,
                    thumbnailUrl: row.logs[0]?.photos[0]?.thumbnailUrl ?? null,
                    updatedAt: row.updatedAt.toISOString(),
                    scheduledAt: row.reservation.scheduledAt.toISOString(),
                    programTitle: row.reservation.program.title,
                    participantCount: row.reservation.participantCount,
                    deliveryMethod: row.reservation.deliveryMethod,
                    reservationStatus: row.reservation.status,
                    statusGroup: view?.group ?? null,
                    detailStatus: view?.detail ?? null,
                };
            }),
            nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
            hasMore,
        };
    }

    async count(
        userId: string,
        query: CountPartnerArtworksQuery,
    ): Promise<CountPartnerArtworksResult> {
        if (query.storeId) await this.ownership.verify(userId, query.storeId);
        const rows = await this.prisma.artwork.findMany({
            where: {
                status: { not: ArtworkStatus.CANCELED },
                reservation: {
                    status: { not: ReservationStatus.CANCELED },
                    ...(query.storeId
                        ? { storeId: query.storeId }
                        : { store: { partner: { userId } } }),
                },
            },
            select: {
                status: true,
                reservation: { select: { status: true, deliveryMethod: true } },
            },
        });
        const filtered = rows.filter((row) => {
            const view = ArtworkPolicy.statusView(
                row.status,
                row.reservation.status,
                row.reservation.deliveryMethod,
            );
            return !query.group || view?.group === query.group;
        });
        const steps: Record<string, number> = {};
        for (const row of filtered) {
            const view = ArtworkPolicy.statusView(
                row.status,
                row.reservation.status,
                row.reservation.deliveryMethod,
            );
            if (view) {
                const key = this.camel(view.detail);
                steps[key] = (steps[key] ?? 0) + 1;
            }
        }
        return { group: query.group ?? null, total: filtered.length, steps };
    }

    async detail(userId: string, artworkId: string): Promise<GetPartnerArtworkDetailResult> {
        const row = await this.findOwnedArtwork(userId, artworkId, {
            logs: {
                orderBy: { createdAt: 'asc' },
                include: {
                    user: { select: { nickname: true } },
                    photos: {
                        where: { status: ImageUploadStatus.UPLOADED },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            },
            reservation: {
                include: { program: { select: { title: true } }, delivery: true },
            },
        });
        const view = ArtworkPolicy.statusView(
            row.status,
            row.reservation.status,
            row.reservation.deliveryMethod,
        );
        const currentLog = [...row.logs].reverse().find((log) => log.toStatus === row.status);
        return {
            artwork: {
                id: row.id,
                reservationId: row.reservationId,
                reserverName: row.reservation.reserverName,
                status: row.status,
                displayState: this.displayState(view?.group, view?.detail),
                internalMemo: row.internalMemo,
                estimatedCompletedAt: row.estimatedCompletedAt?.toISOString() ?? null,
                elapsedDays: Math.max(
                    0,
                    Math.floor((Date.now() - row.createdAt.getTime()) / 86_400_000),
                ),
                artworkLogId: currentLog?.id ?? null,
                currentStagePhotos: (currentLog?.photos ?? []).map(this.photoResponse),
                logs: row.logs.map((log: ArtworkLogWithUserPhotos) => ({
                    id: log.id,
                    fromStatus: log.fromStatus,
                    toStatus: log.toStatus,
                    changedByNickname: log.user.nickname,
                    memo: log.memo,
                    createdAt: log.createdAt.toISOString(),
                })),
                deliveryMethod: row.reservation.deliveryMethod,
                delivery: this.deliveryResponse(row.reservation.delivery),
                timeline: ARTWORK_SEQUENCE.map((stage) => {
                    const log = row.logs.find(
                        (entry: ArtworkLogWithUserPhotos) => entry.toStatus === stage,
                    );
                    const currentIndex = ARTWORK_SEQUENCE.indexOf(
                        row.status as (typeof ARTWORK_SEQUENCE)[number],
                    );
                    const stageIndex = ARTWORK_SEQUENCE.indexOf(stage);
                    return {
                        stage,
                        state:
                            stage === row.status
                                ? 'CURRENT'
                                : stageIndex < currentIndex
                                  ? 'COMPLETED'
                                  : 'UPCOMING',
                        changedAt: log?.createdAt.toISOString() ?? null,
                        photos: (log?.photos ?? []).map(this.photoResponse),
                    };
                }),
                reservation: {
                    id: row.reservation.id,
                    reservationNumber: row.reservation.id,
                    programTitle: row.reservation.program.title,
                    scheduledAt: row.reservation.scheduledAt.toISOString(),
                    participantCount: row.reservation.participantCount,
                    reserverName: row.reservation.reserverName,
                    reserverPhone: row.reservation.reserverPhone,
                    internalMemo: row.reservation.internalMemo,
                },
                availableAction: this.availableAction(row),
            },
        };
    }

    async updateStatus(
        userId: string,
        artworkId: string,
        dto: UpdateArtworkStatusRequest,
    ): Promise<UpdateArtworkStatusResult> {
        const row = await this.findOwnedArtwork(userId, artworkId);
        if (row.status === ArtworkStatus.COMPLETED || row.status === ArtworkStatus.CANCELED) {
            throw this.error(
                'ARTWORK_ALREADY_COMPLETED',
                'Artwork is already terminal.',
                HttpStatus.CONFLICT,
            );
        }
        if (!ArtworkPolicy.canTransition(row.status, dto.status as ArtworkStatus)) {
            throw this.error(
                'INVALID_STATUS_TRANSITION',
                'Invalid artwork status transition.',
                HttpStatus.BAD_REQUEST,
            );
        }
        const artwork = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.artwork.update({
                where: { id: artworkId },
                data: { status: dto.status as ArtworkStatus },
                select: { id: true, status: true, updatedAt: true },
            });
            await tx.artworkLog.create({
                data: {
                    artworkId,
                    changedBy: userId,
                    fromStatus: row.status,
                    toStatus: dto.status as ArtworkStatus,
                    memo: dto.memo,
                },
            });
            await this.createNotification(
                tx,
                row.reservation.userId,
                artworkId,
                row.reservationId,
                NotificationType.ARTWORK_STATUS,
            );
            return updated;
        });
        return { artwork: { ...artwork, updatedAt: artwork.updatedAt.toISOString() } };
    }

    async bulkUpdateStatus(
        userId: string,
        dto: BulkUpdateArtworkStatusRequest,
    ): Promise<BulkUpdateArtworkStatusResult> {
        if (
            !ArtworkPolicy.canTransition(
                dto.fromStatus as ArtworkStatus,
                dto.toStatus as ArtworkStatus,
            )
        ) {
            throw this.error(
                'INVALID_STATUS_TRANSITION',
                'Invalid artwork status transition.',
                HttpStatus.BAD_REQUEST,
            );
        }
        const rows = await this.prisma.artwork.findMany({
            where: { id: { in: dto.artworkIds } },
            select: {
                id: true,
                status: true,
                reservationId: true,
                reservation: {
                    select: {
                        storeId: true,
                        userId: true,
                        store: { select: { partner: { select: { userId: true } } } },
                    },
                },
            },
        });
        if (rows.length !== dto.artworkIds.length)
            throw this.error('ARTWORK_NOT_FOUND', 'Artwork not found.', HttpStatus.NOT_FOUND);
        if (rows.some((row) => row.reservation.store.partner.userId !== userId))
            throw this.error('FORBIDDEN', 'Forbidden.', HttpStatus.FORBIDDEN);
        if (new Set(rows.map((row) => row.reservation.storeId)).size !== 1)
            throw this.error(
                'FORBIDDEN',
                'Artworks must belong to one store.',
                HttpStatus.FORBIDDEN,
            );
        if (rows.some((row) => row.status !== dto.fromStatus))
            throw this.error(
                'ARTWORK_STATUS_CHANGED',
                'Artwork status changed.',
                HttpStatus.CONFLICT,
            );

        await this.prisma.$transaction(async (tx) => {
            for (const row of rows) {
                await tx.artwork.update({
                    where: { id: row.id },
                    data: { status: dto.toStatus as ArtworkStatus },
                });
                await tx.artworkLog.create({
                    data: {
                        artworkId: row.id,
                        changedBy: userId,
                        fromStatus: dto.fromStatus as ArtworkStatus,
                        toStatus: dto.toStatus as ArtworkStatus,
                    },
                });
                await this.createNotification(
                    tx,
                    row.reservation.userId,
                    row.id,
                    row.reservationId,
                    NotificationType.ARTWORK_STATUS,
                );
            }
        });
        return { updatedCount: rows.length, status: dto.toStatus };
    }

    async createPhotos(
        userId: string,
        artworkId: string,
        dto: CreateArtworkPhotosRequest,
    ): Promise<CreateArtworkPhotosResult> {
        const row = await this.findOwnedArtwork(userId, artworkId, {
            logs: { where: { id: dto.artworkLogId }, include: { photos: true } },
        });
        if (row.status === ArtworkStatus.CANCELED)
            throw this.error('ARTWORK_CANCELED', 'Artwork is canceled.', HttpStatus.CONFLICT);
        const log = row.logs[0];
        if (!log || log.toStatus !== row.status)
            throw this.error(
                'FORBIDDEN',
                'Artwork log is not the current stage.',
                HttpStatus.FORBIDDEN,
            );
        if (log.photos.length + dto.files.length > 5)
            throw this.error(
                'INVALID_FILE_SPEC',
                'Maximum five photos per stage.',
                HttpStatus.BAD_REQUEST,
            );

        const uploads = [];
        for (const file of dto.files) {
            const key = buildObjectKey(
                `artworks/${artworkId}/${dto.artworkLogId}`,
                file.contentType,
                file.filename,
            );
            const imageUrl = `${CDN_BASE}/${key}`;
            const photo = await this.prisma.artworkPhoto.create({
                data: {
                    artworkLogId: dto.artworkLogId,
                    imageUrl,
                    status: ImageUploadStatus.PENDING,
                },
                select: { id: true },
            });
            const { uploadUrl } = await this.s3.createPresignedPutUrl(key, file.contentType, 600);
            uploads.push({ photoId: photo.id, uploadUrl, imageUrl });
        }
        return { photos: uploads };
    }

    async confirmPhoto(
        userId: string,
        artworkId: string,
        photoId: string,
    ): Promise<ConfirmArtworkPhotoResult> {
        const photo = await this.findOwnedPhoto(userId, artworkId, photoId);
        if (photo.status === ImageUploadStatus.UPLOADED)
            throw this.error(
                'PHOTO_ALREADY_CONFIRMED',
                'Photo already confirmed.',
                HttpStatus.CONFLICT,
            );
        if (!(await this.s3.objectExists(keyFromImageUrl(photo.imageUrl))))
            throw this.error(
                'UPLOAD_OBJECT_NOT_FOUND',
                'Upload object not found.',
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        const updated = await this.prisma.artworkPhoto.update({
            where: { id: photoId },
            data: { status: ImageUploadStatus.UPLOADED },
            select: { id: true, status: true },
        });
        return { photo: updated };
    }

    async deletePhoto(
        userId: string,
        artworkId: string,
        photoId: string,
    ): Promise<DeleteArtworkPhotoResult> {
        const photo = await this.findOwnedPhoto(userId, artworkId, photoId);
        await this.prisma.artworkPhoto.delete({ where: { id: photoId } });
        await this.s3.deleteImageObjects([photo.imageUrl, photo.thumbnailUrl]);
        return { deletedPhotoId: photoId };
    }

    async updateDeliveryInfo(
        userId: string,
        artworkId: string,
        dto: UpdateArtworkDeliveryInfoRequest,
    ): Promise<UpdateArtworkDeliveryInfoResult> {
        const row = await this.findOwnedArtwork(userId, artworkId, {
            reservation: { include: { delivery: true } },
        });
        if (TERMINAL_RESERVATION_STATUSES.includes(row.reservation.status))
            throw this.error(
                'DELIVERY_METHOD_NOT_EDITABLE',
                'Delivery method is not editable.',
                HttpStatus.CONFLICT,
            );
        const result = await this.prisma.$transaction(async (tx) => {
            await tx.reservation.update({
                where: { id: row.reservationId },
                data: { deliveryMethod: dto.deliveryMethod as ReservationDeliveryMethod },
            });
            if (dto.deliveryMethod === ReservationDeliveryMethod.DELIVERY) {
                return tx.delivery.upsert({
                    where: { reservationId: row.reservationId },
                    create: { reservationId: row.reservationId, ...this.deliveryData(dto) },
                    update: this.deliveryData(dto),
                });
            }
            return row.reservation.delivery;
        });
        return { deliveryMethod: dto.deliveryMethod, delivery: this.deliveryResponse(result) };
    }

    async updateDelivery(
        userId: string,
        artworkId: string,
        dto: UpdateArtworkDeliveryRequest,
    ): Promise<UpdateArtworkDeliveryResult> {
        const row = await this.findOwnedArtwork(userId, artworkId, {
            reservation: { include: { delivery: true } },
        });
        let status: ReservationStatus;
        if (dto.action === 'SHIP') {
            if (
                row.reservation.deliveryMethod !== ReservationDeliveryMethod.DELIVERY ||
                row.status !== ArtworkStatus.COMPLETED ||
                row.reservation.status !== ReservationStatus.IN_PROGRESS ||
                !row.reservation.delivery?.recipientName ||
                !row.reservation.delivery.recipientPhone ||
                !row.reservation.delivery.postalCode ||
                !row.reservation.delivery.shippingAddress
            ) {
                throw this.error(
                    'INVALID_RESERVATION_STATUS',
                    'Invalid reservation status.',
                    HttpStatus.CONFLICT,
                );
            }
            status = ReservationStatus.SHIPPED;
        } else if (dto.action === 'PICKUP_READY') {
            if (
                row.reservation.deliveryMethod !== ReservationDeliveryMethod.PICKUP ||
                row.status !== ArtworkStatus.COMPLETED ||
                row.reservation.status !== ReservationStatus.IN_PROGRESS
            )
                throw this.error(
                    'INVALID_RESERVATION_STATUS',
                    'Invalid reservation status.',
                    HttpStatus.CONFLICT,
                );
            status = ReservationStatus.PICKUP_READY;
        } else if (dto.action === 'PICKUP_DONE') {
            if (
                row.reservation.deliveryMethod !== ReservationDeliveryMethod.PICKUP ||
                row.reservation.status !== ReservationStatus.PICKUP_READY
            )
                throw this.error(
                    'INVALID_RESERVATION_STATUS',
                    'Invalid reservation status.',
                    HttpStatus.CONFLICT,
                );
            status = ReservationStatus.PICKUP_DONE;
        } else {
            if (
                row.reservation.deliveryMethod !== ReservationDeliveryMethod.DELIVERY ||
                row.reservation.status !== ReservationStatus.SHIPPED
            )
                throw this.error(
                    'INVALID_RESERVATION_STATUS',
                    'Invalid reservation status.',
                    HttpStatus.CONFLICT,
                );
            status = ReservationStatus.DELIVERED;
        }
        const reservation = await this.prisma.$transaction(async (tx) => {
            if (dto.action === 'SHIP') {
                await tx.delivery.update({
                    where: { reservationId: row.reservationId },
                    data: {
                        trackingNumber: dto.trackingNumber,
                        carrier: dto.carrier,
                        shippedAt: new Date(dto.shippedAt),
                    },
                });
            }
            const updated = await tx.reservation.update({
                where: { id: row.reservationId },
                data: { status },
                include: { delivery: true },
            });
            await this.createNotification(
                tx,
                row.reservation.userId,
                artworkId,
                row.reservationId,
                dto.action === 'SHIP'
                    ? NotificationType.SHIPPING_STARTED
                    : NotificationType.ARTWORK_STATUS,
            );
            return updated;
        });
        return {
            reservation: {
                id: reservation.id,
                status: reservation.status,
                trackingNumber: reservation.delivery?.trackingNumber ?? null,
                carrier: reservation.delivery?.carrier ?? null,
                shippedAt: reservation.delivery?.shippedAt?.toISOString().slice(0, 10) ?? null,
            },
        };
    }

    // Includes differ by use case; ownership and existence are normalized here.
    private async findOwnedArtwork(
        userId: string,
        artworkId: string,
        include: Prisma.ArtworkInclude = {},
    ): Promise<any> {
        // eslint-disable-line @typescript-eslint/no-explicit-any
        const row = await this.prisma.artwork.findUnique({
            where: { id: artworkId },
            include: {
                ...include,
                reservation: include.reservation ?? {
                    include: { store: { include: { partner: true } } },
                },
            },
        });
        if (!row) throw this.error('ARTWORK_NOT_FOUND', 'Artwork not found.', HttpStatus.NOT_FOUND);
        const owner = await this.prisma.store.findUnique({
            where: { id: row.reservation.storeId },
            select: { partner: { select: { userId: true } } },
        });
        if (owner?.partner.userId !== userId)
            throw this.error('FORBIDDEN', 'Forbidden.', HttpStatus.FORBIDDEN);
        return row;
    }

    private async findOwnedPhoto(userId: string, artworkId: string, photoId: string) {
        await this.findOwnedArtwork(userId, artworkId);
        const photo = await this.prisma.artworkPhoto.findFirst({
            where: { id: photoId, artworkLog: { artworkId } },
        });
        if (!photo) throw this.error('PHOTO_NOT_FOUND', 'Photo not found.', HttpStatus.NOT_FOUND);
        return photo;
    }

    private async createNotification(
        tx: Prisma.TransactionClient,
        userId: string | null,
        artworkId: string,
        reservationId: string,
        type: NotificationType,
    ) {
        if (!userId) return;
        await tx.notification.create({
            data: {
                userId,
                artworkId,
                reservationId,
                type,
                title: 'Artwork update',
                body: 'Your artwork status has been updated.',
                status: NotificationStatus.PENDING,
            },
        });
    }

    private deliveryData(dto: UpdateArtworkDeliveryInfoRequest) {
        return {
            recipientName: dto.recipientName,
            recipientPhone: dto.recipientPhone,
            postalCode: dto.postalCode,
            shippingAddress: dto.address,
            addressDetail: dto.addressDetail,
            carrier: dto.carrier,
            trackingNumber: dto.trackingNumber,
        };
    }

    private availableAction(row: {
        status: ArtworkStatus;
        reservation: { status: ReservationStatus; deliveryMethod: ReservationDeliveryMethod };
    }): ArtworkAvailableAction[] {
        if (row.status !== ArtworkStatus.COMPLETED) return ['UPDATE_STATUS'];
        if (row.reservation.deliveryMethod === ReservationDeliveryMethod.DELIVERY) {
            return row.reservation.status === ReservationStatus.SHIPPED ? ['DELIVERED'] : ['SHIP'];
        }
        return row.reservation.status === ReservationStatus.PICKUP_READY
            ? ['PICKUP_DONE']
            : ['PICKUP_READY'];
    }

    private displayState(group?: string, detail?: string) {
        return {
            label: group ?? 'UNKNOWN',
            description: detail ?? 'UNKNOWN',
            subLabel: detail ?? 'UNKNOWN',
        };
    }

    private photoResponse(photo: { id: string; thumbnailUrl: string | null; imageUrl: string }) {
        return { id: photo.id, thumbnailUrl: photo.thumbnailUrl, imageUrl: photo.imageUrl };
    }

    private deliveryResponse(
        delivery: {
            id: string;
            recipientName: string | null;
            recipientPhone: string | null;
            postalCode: string | null;
            shippingAddress: string | null;
            addressDetail: string | null;
            trackingNumber: string | null;
            carrier: string | null;
            shippedAt: Date | null;
        } | null,
    ) {
        if (!delivery) return null;
        return {
            id: delivery.id,
            recipientName: delivery.recipientName,
            recipientPhone: delivery.recipientPhone,
            postalCode: delivery.postalCode,
            address: delivery.shippingAddress,
            addressDetail: delivery.addressDetail,
            trackingNumber: delivery.trackingNumber,
            carrier: delivery.carrier,
            shippedAt: delivery.shippedAt?.toISOString().slice(0, 10) ?? null,
        };
    }

    private camel(value: string) {
        return value
            .toLowerCase()
            .replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    }

    private error(code: string, message: string, status: number) {
        return new BusinessException(code, message, status);
    }
}
