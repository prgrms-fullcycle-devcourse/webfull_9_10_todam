import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { S3Service } from '../../../../common/s3/s3.service';
import { keyFromImageUrl } from '../../../../common/s3/s3-object.util';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type {
    UpdateBusinessDocumentDto,
    UpdateBusinessDocumentResponseDto,
} from '../../presentation/dto/update-business-document.dto';

@Injectable()
export class PrismaUpdateBusinessDocumentCommand {
    constructor(
        private readonly prisma: PrismaService,
        private readonly s3: S3Service,
    ) {}

    async execute(
        userId: string,
        storeId: string,
        dto: UpdateBusinessDocumentDto,
    ): Promise<UpdateBusinessDocumentResponseDto> {
        const partner = await this.prisma.partner.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!partner) {
            throw new BusinessException(
                'FORBIDDEN',
                '파트너 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
            select: { id: true, partnerId: true, status: true },
        });
        if (!store) {
            throw new BusinessException(
                'STORE_NOT_FOUND',
                '공방을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 소유권 검증
        if (store.partnerId !== partner.id) {
            throw new BusinessException(
                'FORBIDDEN',
                '해당 공방에 대한 권한이 없습니다.',
                HttpStatus.FORBIDDEN,
            );
        }

        // 반려 상태만 재수정·재제출 가능
        if (store.status !== 'REJECTED') {
            throw new BusinessException(
                'INVALID_STORE_STATUS',
                '반려된 공방만 사업자 정보를 재수정할 수 있습니다.',
                HttpStatus.CONFLICT,
            );
        }

        // documentUrl 이 non-null 로 전달되면 실제 업로드 완료 여부 검증.
        if (dto.documentUrl) {
            const exists = await this.s3.objectExists(keyFromImageUrl(dto.documentUrl));
            if (!exists) {
                throw new BusinessException(
                    'BAD_REQUEST',
                    '사업자등록증 파일이 업로드되지 않았습니다.',
                    HttpStatus.BAD_REQUEST,
                );
            }
        }

        // 전달된 필드만 부분 갱신. business_documents 는 storeId(+partnerId)로 식별.
        const data: {
            businessNumber?: string;
            businessName?: string;
            ownerName?: string;
            businessAddress?: string;
            email?: string;
            documentUrl?: string | null;
        } = {};

        if (dto.businessNumber !== undefined) {
            // contract 는 하이픈 포함(000-00-00000), DB 는 하이픈 없는 숫자 10자리로 저장(create-store 와 동일).
            data.businessNumber = dto.businessNumber.replace(/-/g, '');
        }
        if (dto.businessName !== undefined) data.businessName = dto.businessName;
        if (dto.ownerName !== undefined) data.ownerName = dto.ownerName;
        if (dto.businessAddress !== undefined) data.businessAddress = dto.businessAddress;
        if (dto.email !== undefined) data.email = dto.email;
        if (dto.documentUrl !== undefined) data.documentUrl = dto.documentUrl;

        if (Object.keys(data).length > 0) {
            await this.prisma.businessDocument.updateMany({
                where: { storeId: store.id, partnerId: partner.id },
                data,
            });
        }

        // 저장 시 재심사 전이: REJECTED → PENDING
        const updated = await this.prisma.store.update({
            where: { id: store.id },
            data: { status: 'PENDING' },
            select: { id: true, status: true, updatedAt: true },
        });

        return {
            store: {
                id: updated.id,
                status: updated.status,
                updatedAt: updated.updatedAt.toISOString(),
            },
        };
    }
}
