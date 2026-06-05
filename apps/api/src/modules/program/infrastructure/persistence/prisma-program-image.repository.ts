import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
    CreatePendingProgramImageInput,
    ProgramImage,
    ProgramImageRepository,
    ProgramImageStatus,
} from '../../domain/repositories/program-image.repository';

@Injectable()
export class PrismaProgramImageRepository extends ProgramImageRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    findByProgramAndId(programId: string, imageId: string): Promise<ProgramImage | null> {
        return this.prisma.programImage.findFirst({
            where: { id: imageId, programId },
            select: { id: true, imageUrl: true, thumbnailUrl: true, status: true },
        }) as Promise<ProgramImage | null>;
    }

    createPending(input: CreatePendingProgramImageInput): Promise<{ id: string }> {
        // 대표 이미지(isThumbnail)는 클래스당 최대 1개 불변식 — 새 대표 등록 시 기존 대표를
        // 모두 내린 뒤 row 를 선 생성한다(트랜잭션). 상태는 PENDING(업로드 대기).
        return this.prisma.$transaction(async (tx) => {
            if (input.isThumbnail) {
                await tx.programImage.updateMany({
                    where: { programId: input.programId, isThumbnail: true },
                    data: { isThumbnail: false },
                });
            }

            return tx.programImage.create({
                data: {
                    programId: input.programId,
                    imageUrl: input.imageUrl,
                    isThumbnail: input.isThumbnail,
                    status: 'PENDING',
                },
                select: { id: true },
            });
        });
    }

    async markUploaded(imageId: string): Promise<{ id: string; status: ProgramImageStatus }> {
        const image = await this.prisma.programImage.update({
            where: { id: imageId },
            data: { status: 'UPLOADED' },
            select: { id: true, status: true },
        });
        return { id: image.id, status: image.status as ProgramImageStatus };
    }

    async delete(imageId: string): Promise<void> {
        await this.prisma.programImage.delete({ where: { id: imageId } });
    }
}
