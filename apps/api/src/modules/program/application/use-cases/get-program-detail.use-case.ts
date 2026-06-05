import { Injectable } from '@nestjs/common';
import { PartnerProgramDetailReader } from '../../domain/repositories/program-readers';
import type { GetProgramDetailResponseDto } from '../../presentation/dto/get-program-detail.dto';

@Injectable()
export class GetProgramDetailUseCase {
    constructor(private readonly reader: PartnerProgramDetailReader) {}

    execute(
        userId: string,
        storeId: string,
        programId: string,
    ): Promise<GetProgramDetailResponseDto> {
        // 소유권 검증과 조회를 reader 가 단일 쿼리로 함께 처리한다.
        return this.reader.execute(userId, storeId, programId);
    }
}
