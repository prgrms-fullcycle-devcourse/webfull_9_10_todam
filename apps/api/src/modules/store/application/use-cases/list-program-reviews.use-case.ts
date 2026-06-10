import { Injectable } from '@nestjs/common';
import { ProgramReviewsReader } from '../../domain/repositories/store-readers';
import type {
    ListProgramReviewsQuery,
    ListProgramReviewsResult,
} from '../../domain/repositories/store-readers';

@Injectable()
export class ListProgramReviewsUseCase {
    constructor(private readonly reader: ProgramReviewsReader) {}

    execute(
        slug: string,
        programId: string,
        query: ListProgramReviewsQuery,
    ): Promise<ListProgramReviewsResult> {
        return this.reader.execute(slug, programId, query);
    }
}
