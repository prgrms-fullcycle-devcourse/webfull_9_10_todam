import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type {
    UpdateStoreDto,
    UpdateStoreResponseDto,
} from '../../presentation/dto/update-store.dto';

// @db.Time(6) 컬럼은 CreateStoreUseCase 와 동일하게 UTC 기준으로 저장한다.
function parseTime(hhmm: string): Date {
    const [hours, minutes] = hhmm.split(':').map(Number);
    const d = new Date(0);
    d.setUTCHours(hours!, minutes!, 0, 0);
    return d;
}

@Injectable()
export class UpdateStoreUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(
        userId: string,
        storeId: string,
        dto: UpdateStoreDto,
    ): Promise<UpdateStoreResponseDto> {
        const partner = await this.prisma.partner.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!partner) {
            throw new BusinessException(
                'FORBIDDEN',
                '해당 공방에 대한 접근 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: { id: true, partnerId: true },
        });

        // 미존재·삭제 공방 → 404
        if (!store) {
            throw new BusinessException(
                'STORE_NOT_FOUND',
                '공방을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 소유 권한 검증 — DEC-3: 상태 기반 차단 없음(전 상태 수정 허용). 소유권만 본다.
        if (store.partnerId !== partner.id) {
            throw new BusinessException(
                'FORBIDDEN',
                '해당 공방에 대한 접근 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // slug 변경 시 중복 검사 — OD-2: 등록과 동일하게 409 STORE_SLUG_DUPLICATED.
        // redirect/이전 slug 보존 없이 즉시 교체(DEC-1).
        if (dto.slug !== undefined) {
            const existing = await this.prisma.store.findUnique({
                where: { slug: dto.slug },
                select: { id: true },
            });
            if (existing && existing.id !== storeId) {
                throw new BusinessException(
                    'STORE_SLUG_DUPLICATED',
                    '이미 사용 중인 공방 URL입니다.',
                    HttpStatus.CONFLICT,
                );
            }
        }

        // 전달된 필드만 업데이트. status 는 불변(재검수 전이 없음). updated_at 은 @updatedAt 으로 자동 갱신.
        const data: Prisma.StoreUpdateInput = {};
        if (dto.name !== undefined) data.name = dto.name;
        if (dto.slug !== undefined) data.slug = dto.slug;
        if (dto.description !== undefined) data.description = dto.description;
        if (dto.phone !== undefined) data.phone = dto.phone;
        if (dto.convenienceInfo !== undefined) {
            data.convenienceInfo = dto.convenienceInfo as unknown as Prisma.InputJsonValue;
        }
        if (dto.autoConfirm !== undefined) data.autoConfirm = dto.autoConfirm;
        if (dto.cancelDeadlineDays !== undefined) data.cancelDeadlineDays = dto.cancelDeadlineDays;
        if (dto.reservationIntervalMinutes !== undefined) {
            data.reservationIntervalMinutes = dto.reservationIntervalMinutes;
        }
        if (dto.maxCapacityPerSlot !== undefined) {
            data.maxCapacityPerSlot = dto.maxCapacityPerSlot;
        }

        const updated = await this.prisma.$transaction(async (tx) => {
            // operatingHours 배열 전체 치환(DEC-4).
            if (dto.operatingHours !== undefined) {
                await tx.storeOperatingHour.deleteMany({ where: { storeId } });
                if (dto.operatingHours.length > 0) {
                    await tx.storeOperatingHour.createMany({
                        data: dto.operatingHours.map((h) => ({
                            storeId,
                            dayOfWeek: h.dayOfWeek as never,
                            openTime: parseTime(h.openTime),
                            closeTime: parseTime(h.closeTime),
                            breakStart: h.breakStart ? parseTime(h.breakStart) : null,
                            breakEnd: h.breakEnd ? parseTime(h.breakEnd) : null,
                        })),
                    });
                }
            }

            // images 배열 전체 치환(OD-3) — 전달된 id 목록만 해당 공방 이미지로 남기고
            // 정렬 순서를 목록 순서대로 재배치, 목록에 없는 이미지는 제거한다.
            if (dto.images !== undefined) {
                const owned = await tx.storeImage.findMany({
                    where: { storeId },
                    select: { id: true },
                });
                const ownedIds = new Set(owned.map((img) => img.id));
                const keepIds = dto.images.filter((id) => ownedIds.has(id));

                await tx.storeImage.deleteMany({
                    where: { storeId, id: { notIn: keepIds.length > 0 ? keepIds : ['__none__'] } },
                });

                for (let i = 0; i < keepIds.length; i += 1) {
                    await tx.storeImage.update({
                        where: { id: keepIds[i] },
                        data: {
                            sortOrder: i + 1,
                            isThumbnail: i === 0,
                        },
                    });
                }
            }

            return tx.store.update({
                where: { id: storeId },
                data,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    status: true,
                    updatedAt: true,
                },
            });
        });

        return {
            store: {
                id: updated.id,
                name: updated.name,
                slug: updated.slug,
                status: updated.status,
                updatedAt: updated.updatedAt.toISOString(),
            },
        };
    }
}
