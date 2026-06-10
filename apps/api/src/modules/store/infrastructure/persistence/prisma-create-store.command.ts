import { HttpStatus, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { DayOfWeek } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { S3Service } from '../../../../common/s3/s3.service';
import { assertOwnedBusinessDocumentImage } from '../../../../common/s3/business-document.util';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { parseStoreTime } from '../../domain/time.util';
import type { CreateStoreInput, CreateStoreResult } from '../../domain/repositories/store-writers';

function generateSlug(): string {
    return randomBytes(6).toString('hex');
}

@Injectable()
export class PrismaCreateStoreCommand {
    constructor(
        private readonly prisma: PrismaService,
        private readonly s3: S3Service,
    ) {}

    async execute(userId: string, dto: CreateStoreInput): Promise<CreateStoreResult> {
        const slug = dto.slug ?? generateSlug();

        // 사업자등록증 documentUrl이 있으면 소유권(IDOR)·업로드 완료·이미지 타입을 검증.
        const documentUrl = dto.businessDocument.documentUrl ?? null;
        if (documentUrl) {
            await assertOwnedBusinessDocumentImage(this.s3, userId, documentUrl);
        }

        const existing = await this.prisma.store.findUnique({
            where: { slug },
            select: { id: true },
        });
        if (existing) {
            throw new BusinessException(
                'SLUG_CONFLICT',
                'slug가 이미 사용 중입니다.',
                HttpStatus.CONFLICT,
            );
        }

        let partner = await this.prisma.partner.findUnique({
            where: { userId },
            select: { id: true, status: true },
        });

        if (!partner) {
            // 첫 공방 등록 → 파트너 엔티티 자동 생성 (status = PENDING)
            partner = await this.prisma.partner.create({
                data: { userId },
                select: { id: true, status: true },
            });
        } else if (partner.status !== 'APPROVED') {
            // 추가 공방 등록은 승인된 파트너만 가능
            throw new BusinessException(
                'PARTNER_NOT_APPROVED',
                '승인된 파트너만 추가 공방을 등록할 수 있습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        const store = await this.prisma.store.create({
            data: {
                partnerId: partner.id,
                name: dto.name,
                slug,
                description: dto.description ?? null,
                phone: dto.phone,
                address: dto.address,
                latitude: dto.latitude,
                longitude: dto.longitude,
                convenienceInfo: dto.convenienceInfo as unknown as Record<string, boolean>,
                autoConfirm: dto.autoConfirm,
                cancelDeadlineDays: dto.cancelDeadlineDays,
                reservationIntervalMinutes: dto.reservationIntervalMinutes,
                maxCapacityPerSlot: dto.maxCapacityPerSlot,
                status: 'DRAFT',
                operatingHours: {
                    create: dto.operatingHours.map((h) => ({
                        dayOfWeek: h.dayOfWeek as DayOfWeek,
                        openTime: parseStoreTime(h.openTime),
                        closeTime: parseStoreTime(h.closeTime),
                        breakStart: h.breakStart ? parseStoreTime(h.breakStart) : null,
                        breakEnd: h.breakEnd ? parseStoreTime(h.breakEnd) : null,
                    })),
                },
                businessDocs: {
                    create: {
                        partnerId: partner.id,
                        email: dto.businessDocument.email ?? null,
                        ownerName: dto.businessDocument.ownerName,
                        businessName: dto.businessDocument.businessName,
                        businessNumber: dto.businessDocument.businessNumber,
                        businessAddress: dto.businessDocument.businessAddress,
                        documentUrl,
                        startDate: dto.businessDocument.startDate ?? null,
                    },
                },
            },
            select: {
                id: true,
                partnerId: true,
                name: true,
                slug: true,
                status: true,
                createdAt: true,
            },
        });

        return {
            store: {
                id: store.id,
                partnerId: store.partnerId,
                name: store.name,
                slug: store.slug,
                status: store.status,
                createdAt: store.createdAt.toISOString(),
            },
        };
    }
}
