import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
    DayOfWeek,
    PartnerStatus,
    VerificationStatus,
    BusinessState,
    Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { S3Service } from '../../../../common/s3/s3.service';
import { assertOwnedBusinessDocumentImage } from '../../../../common/s3/business-document.util';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { parseStoreTime } from '../../domain/time.util';
import { NtsService, NtsApiError } from '../nts.service';
import { resolveVerification } from '../../application/use-cases/verify-business-document.use-case';
import type { CreateStoreInput, CreateStoreResult } from '../../domain/repositories/store-writers';

function generateSlug(): string {
    return randomBytes(6).toString('hex');
}

@Injectable()
export class PrismaCreateStoreCommand {
    private readonly logger = new Logger(PrismaCreateStoreCommand.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly s3: S3Service,
        private readonly nts: NtsService,
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
        } else if (partner.status === PartnerStatus.TERMINATED) {
            partner = await this.prisma.partner.update({
                where: { id: partner.id },
                data: {
                    status: PartnerStatus.PENDING,
                    terminatedAt: null,
                    rejectedReason: null,
                    suspendedReason: null,
                    suspendedAt: null,
                    approvedAt: null,
                },
                select: { id: true, status: true },
            });
        } else if (partner.status !== PartnerStatus.APPROVED) {
            // 추가 공방 등록은 승인된 파트너만 가능
            throw new BusinessException(
                'PARTNER_NOT_APPROVED',
                '승인된 파트너만 추가 공방을 등록할 수 있습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // ── 국세청 진위확인 재검증 (신뢰경계 내 서버 측 재검증) ───────────────────
        // FE의 게이트 결과를 신뢰하지 않고 서버가 직접 국세청 API를 재호출해 결과를 영구 저장한다.
        // startDate가 없으면 재검증을 건너뛰고 PENDING으로 저장한다.
        // 검증을 실제로 수행한 경우에만 verificationCheckedAt을 기록한다(스킵 시 null = 미검증).
        let verificationCheckedAt: Date | null = null;
        let verificationStatus: VerificationStatus = VerificationStatus.PENDING;
        let verifiedAt: Date | null = null;
        let businessState: BusinessState | null = null;
        let ntsRaw: Prisma.InputJsonValue | null = null;

        if (dto.businessDocument.startDate) {
            verificationCheckedAt = new Date();
            try {
                // validate 호출
                const validateRes = await this.nts.validate(
                    dto.businessDocument.businessNumber,
                    dto.businessDocument.ownerName,
                    dto.businessDocument.startDate,
                );
                ntsRaw = { validate: validateRes._raw } as unknown as Prisma.InputJsonValue;

                const item = validateRes.data[0];
                if (!item || (item.valid !== '01' && item.valid !== '02')) {
                    // 빈 응답·예상 못한 valid → ERROR(fail-closed). best-effort 저장.
                    verificationStatus = VerificationStatus.ERROR;
                } else if (item.valid === '02') {
                    // MISMATCH — best-effort 저장(제출 자체는 막지 않음, 관리자 심사에서 재확인)
                    verificationStatus = VerificationStatus.MISMATCH;
                } else {
                    // valid === '01': 납세자 상태 확인
                    let bStt: string | undefined = item.b_stt;
                    if (!bStt) {
                        const statusRes = await this.nts.getStatus(
                            dto.businessDocument.businessNumber,
                        );
                        ntsRaw = {
                            ...(ntsRaw as object),
                            status: statusRes._raw,
                        } as unknown as Prisma.InputJsonValue;
                        bStt = statusRes.data[0]?.b_stt;
                    }

                    const resolved = resolveVerification(bStt);
                    verificationStatus =
                        resolved.verificationStatus as unknown as VerificationStatus;
                    businessState = (resolved.businessState as unknown as BusinessState) ?? null;
                    if (verificationStatus === VerificationStatus.VERIFIED) {
                        verifiedAt = new Date();
                    }
                }
            } catch (error) {
                if (error instanceof NtsApiError) {
                    // ERROR — best-effort 저장(제출 자체는 막지 않음)
                    verificationStatus = VerificationStatus.ERROR;
                    this.logger.error(
                        `제출 시 국세청 재검증 실패 (businessNumber=${dto.businessDocument.businessNumber}): ${error.message}`,
                    );
                } else {
                    throw error;
                }
            }
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
                regionSido: dto.regionSido ?? null,
                regionSigungu: dto.regionSigungu ?? null,
                regionDong: dto.regionDong ?? null,
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
                        verificationStatus,
                        verifiedAt,
                        verificationCheckedAt,
                        businessState,
                        ntsRaw: ntsRaw ?? undefined,
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
