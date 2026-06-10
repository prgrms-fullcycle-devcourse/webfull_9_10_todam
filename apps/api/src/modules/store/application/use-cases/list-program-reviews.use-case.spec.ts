/// <reference types="jest" />
import { HttpStatus } from '@nestjs/common';
import { ListProgramReviewsUseCase } from './list-program-reviews.use-case';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import type {
    ListProgramReviewsQuery,
    ListProgramReviewsResult,
    ProgramReviewsReader,
} from '../../domain/repositories/store-readers';

const SLUG = 'todam-studio';
const PROGRAM_ID = 'prog-uuid-001';

const BASE_QUERY: ListProgramReviewsQuery = { page: 1, limit: 10, sort: 'latest' };

function makeResult(overrides: Partial<ListProgramReviewsResult> = {}): ListProgramReviewsResult {
    return {
        totalCount: 0,
        averageRating: 0,
        reviews: [],
        pagination: { currentPage: 1, totalPages: 0, limit: 10 },
        ...overrides,
    };
}

describe('ListProgramReviewsUseCase', () => {
    const execute = jest.fn<
        Promise<ListProgramReviewsResult>,
        [string, string, ListProgramReviewsQuery]
    >();
    const useCase = new ListProgramReviewsUseCase({ execute } as unknown as ProgramReviewsReader);

    beforeEach(() => {
        execute.mockReset();
    });

    it('프로그램 없음 → reader가 PROGRAM_NOT_FOUND BusinessException을 던지면 그대로 전파', async () => {
        execute.mockRejectedValue(
            new BusinessException(
                'PROGRAM_NOT_FOUND',
                '프로그램을 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            ),
        );

        await expect(useCase.execute(SLUG, PROGRAM_ID, BASE_QUERY)).rejects.toMatchObject({
            errorCode: 'PROGRAM_NOT_FOUND',
        });
    });

    it('latest 정렬로 reader 호출', async () => {
        execute.mockResolvedValue(makeResult());

        await useCase.execute(SLUG, PROGRAM_ID, { page: 1, limit: 10, sort: 'latest' });

        expect(execute).toHaveBeenCalledWith(SLUG, PROGRAM_ID, {
            page: 1,
            limit: 10,
            sort: 'latest',
        });
    });

    it('rating_high 정렬로 reader 호출', async () => {
        execute.mockResolvedValue(makeResult());

        await useCase.execute(SLUG, PROGRAM_ID, { page: 1, limit: 10, sort: 'rating_high' });

        expect(execute).toHaveBeenCalledWith(SLUG, PROGRAM_ID, {
            page: 1,
            limit: 10,
            sort: 'rating_high',
        });
    });

    it('page 파라미터가 reader에 전달됨', async () => {
        execute.mockResolvedValue(
            makeResult({
                totalCount: 25,
                averageRating: 4.5,
                reviews: [],
                pagination: { currentPage: 3, totalPages: 3, limit: 10 },
            }),
        );

        const result = await useCase.execute(SLUG, PROGRAM_ID, {
            page: 3,
            limit: 10,
            sort: 'latest',
        });

        expect(execute).toHaveBeenCalledWith(SLUG, PROGRAM_ID, {
            page: 3,
            limit: 10,
            sort: 'latest',
        });
        expect(result.pagination.currentPage).toBe(3);
        expect(result.pagination.totalPages).toBe(3);
    });

    it('totalPages 계산: 0건이면 0', async () => {
        execute.mockResolvedValue(
            makeResult({ totalCount: 0, pagination: { currentPage: 1, totalPages: 0, limit: 10 } }),
        );

        const result = await useCase.execute(SLUG, PROGRAM_ID, BASE_QUERY);

        expect(result.pagination.totalPages).toBe(0);
    });

    it('averageRating: 0건이면 0', async () => {
        execute.mockResolvedValue(makeResult({ totalCount: 0, averageRating: 0 }));

        const result = await useCase.execute(SLUG, PROGRAM_ID, BASE_QUERY);

        expect(result.averageRating).toBe(0);
    });

    it('averageRating: 소수 1자리 반올림 검증(reader에 위임됨)', async () => {
        execute.mockResolvedValue(makeResult({ totalCount: 3, averageRating: 4.7 }));

        const result = await useCase.execute(SLUG, PROGRAM_ID, BASE_QUERY);

        expect(result.averageRating).toBe(4.7);
    });

    it('isVisible 필터: reader 호출됨(필터 위임)', async () => {
        execute.mockResolvedValue(makeResult());

        await useCase.execute(SLUG, PROGRAM_ID, BASE_QUERY);

        expect(execute).toHaveBeenCalledTimes(1);
    });

    it('nickname 마스킹: reader가 마스킹 처리하여 반환', async () => {
        execute.mockResolvedValue(
            makeResult({
                reviews: [
                    {
                        id: 'review-001',
                        userId: '',
                        nickname: '토담***',
                        rating: 5,
                        content: '좋아요',
                        photos: [],
                        createdAt: '2026-05-10T12:00:00.000Z',
                    },
                ],
            }),
        );

        const result = await useCase.execute(SLUG, PROGRAM_ID, BASE_QUERY);

        expect(result.reviews[0]!.nickname).toBe('토담***');
    });

    it('userId는 빈 문자열로 반환', async () => {
        execute.mockResolvedValue(
            makeResult({
                reviews: [
                    {
                        id: 'review-001',
                        userId: '',
                        nickname: '토담***',
                        rating: 4,
                        content: '',
                        photos: [],
                        createdAt: '2026-05-10T12:00:00.000Z',
                    },
                ],
            }),
        );

        const result = await useCase.execute(SLUG, PROGRAM_ID, BASE_QUERY);

        expect(result.reviews[0]!.userId).toBe('');
    });

    it('photos에 imageUrl만 포함', async () => {
        execute.mockResolvedValue(
            makeResult({
                reviews: [
                    {
                        id: 'review-001',
                        userId: '',
                        nickname: '토담***',
                        rating: 5,
                        content: '좋아요',
                        photos: [{ imageUrl: 'https://cdn.todam.app/reviews/01.jpg' }],
                        createdAt: '2026-05-10T12:00:00.000Z',
                    },
                ],
            }),
        );

        const result = await useCase.execute(SLUG, PROGRAM_ID, BASE_QUERY);

        expect(result.reviews[0]!.photos).toEqual([
            { imageUrl: 'https://cdn.todam.app/reviews/01.jpg' },
        ]);
    });
});
