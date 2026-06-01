import { HttpStatus, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type {
    CreateStoreDto,
    CreateStoreResponseDto,
} from '../../presentation/dto/create-store.dto';

function generateSlug(): string {
    return randomBytes(6).toString('hex');
}

function parseTime(hhmm: string): Date {
    const [hours, minutes] = hhmm.split(':').map(Number);
    const d = new Date(0);
    d.setUTCHours(hours!, minutes!, 0, 0);
    return d;
}

@Injectable()
export class CreateStoreUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(userId: string, dto: CreateStoreDto): Promise<CreateStoreResponseDto> {
        const slug = dto.slug ?? generateSlug();

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
            select: { id: true },
        });

        if (!partner) {
            partner = await this.prisma.partner.create({
                data: { userId },
                select: { id: true },
            });
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
                status: 'DRAFT',
                operatingHours: {
                    create: dto.operatingHours.map((h) => ({
                        dayOfWeek: h.dayOfWeek as any,
                        openTime: parseTime(h.openTime),
                        closeTime: parseTime(h.closeTime),
                        breakStart: h.breakStart ? parseTime(h.breakStart) : null,
                        breakEnd: h.breakEnd ? parseTime(h.breakEnd) : null,
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
