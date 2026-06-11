import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
    PolicyVersionRepository,
    PolicyVersionRow,
} from '../../domain/repositories/policy-version.repository';

@Injectable()
export class PrismaPolicyVersionRepository extends PolicyVersionRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async findAllLatest(): Promise<PolicyVersionRow[]> {
        const rows = await this.prisma.policyVersion.findMany({
            where: { isLatest: true },
            select: {
                policyType: true,
                version: true,
                url: true,
                effectiveAt: true,
            },
        });
        return rows.map((r) => ({
            policyType: r.policyType as string,
            version: r.version,
            url: r.url,
            effectiveAt: r.effectiveAt,
        }));
    }
}
