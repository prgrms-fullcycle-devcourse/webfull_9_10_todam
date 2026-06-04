import { HttpStatus, Injectable } from '@nestjs/common';
import { ProgramStatus, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type {
    AutocompleteStoresResponseDto,
    StoreSuggestionDto,
} from '../../presentation/dto/autocomplete-stores-response.dto';

const REGION_LIMIT = 3;
const STORE_LIMIT = 5;
const PROGRAM_LIMIT = 5;

@Injectable()
export class AutocompleteStoresUseCase {
    constructor(private readonly prisma: PrismaService) {}

    async execute(rawKeyword: string | undefined): Promise<AutocompleteStoresResponseDto> {
        const keyword = rawKeyword?.trim();
        if (!keyword) {
            throw new BusinessException(
                'KEYWORD_REQUIRED',
                'keyword는 필수이며 공백일 수 없습니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        const [regionSuggestions, storeSuggestions, programSuggestions] = await Promise.all([
            this.findRegionSuggestions(keyword),
            this.findStoreSuggestions(keyword),
            this.findProgramSuggestions(keyword),
        ]);

        return {
            suggestions: [...regionSuggestions, ...storeSuggestions, ...programSuggestions],
        };
    }

    // REGION: PUBLISHED 공방이 존재하는 지역의 distinct regionDong 부분매칭 (최대 3건).
    private async findRegionSuggestions(keyword: string): Promise<StoreSuggestionDto[]> {
        const rows = await this.prisma.store.findMany({
            where: {
                status: StoreStatus.PUBLISHED,
                regionDong: { contains: keyword, mode: 'insensitive' },
            },
            select: { regionSido: true, regionSigungu: true, regionDong: true },
            distinct: ['regionSigungu', 'regionDong'],
            orderBy: [{ regionDong: 'asc' }],
        });

        const suggestions: StoreSuggestionDto[] = [];
        const seen = new Set<string>();

        for (const row of rows) {
            const dong = row.regionDong;
            if (!dong) {
                continue;
            }
            // id = 지역 식별자(regionSigungu+regionDong 조합). 중복 방지.
            const id = this.regionId(row.regionSigungu, dong);
            if (seen.has(id)) {
                continue;
            }
            seen.add(id);
            suggestions.push({
                type: 'REGION',
                id,
                text: dong,
                subtitle: this.regionSubtitle(row.regionSido, row.regionSigungu, dong),
            });
            if (suggestions.length >= REGION_LIMIT) {
                break;
            }
        }

        return suggestions;
    }

    // STORE: PUBLISHED 공방명(name) 부분매칭 (최대 5건).
    private async findStoreSuggestions(keyword: string): Promise<StoreSuggestionDto[]> {
        const rows = await this.prisma.store.findMany({
            where: {
                status: StoreStatus.PUBLISHED,
                name: { contains: keyword, mode: 'insensitive' },
            },
            select: {
                id: true,
                name: true,
                regionSido: true,
                regionSigungu: true,
                regionDong: true,
            },
            orderBy: [{ name: 'asc' }],
            take: STORE_LIMIT,
        });

        return rows.map((row) => ({
            type: 'STORE',
            id: row.id,
            text: row.name,
            subtitle: this.regionSubtitle(row.regionSido, row.regionSigungu, row.regionDong),
        }));
    }

    // PROGRAM: ACTIVE 프로그램명(title) 부분매칭 (최대 5건).
    private async findProgramSuggestions(keyword: string): Promise<StoreSuggestionDto[]> {
        const rows = await this.prisma.program.findMany({
            where: {
                status: ProgramStatus.ACTIVE,
                title: { contains: keyword, mode: 'insensitive' },
            },
            select: { id: true, title: true },
            orderBy: [{ title: 'asc' }],
            take: PROGRAM_LIMIT,
        });

        return rows.map((row) => ({
            type: 'PROGRAM',
            id: row.id,
            text: row.title,
            subtitle: null,
        }));
    }

    // 지역 식별자: regionSigungu+regionDong 조합 키. 둘 중 일부가 null이면 가능한 부분으로 구성.
    private regionId(sigungu: string | null, dong: string): string {
        return [sigungu, dong].filter((part): part is string => !!part).join('-');
    }

    // 지역 표기: "{sido} {sigungu} {dong}" — null 파트는 제외하고 공백 결합.
    private regionSubtitle(
        sido: string | null,
        sigungu: string | null,
        dong: string | null,
    ): string | null {
        const parts = [sido, sigungu, dong].filter((part): part is string => !!part);
        return parts.length > 0 ? parts.join(' ') : null;
    }
}
