import { Injectable } from '@nestjs/common';
import { PublicProgramDetailReader } from '../../domain/repositories/program-readers';
import type { GetProgramDetailResponseDto } from '../../presentation/dto/get-program-detail.dto';

@Injectable()
export class GetPublicProgramDetailUseCase {
    constructor(private readonly reader: PublicProgramDetailReader) {}

    execute(slug: string, programId: string): Promise<GetProgramDetailResponseDto> {
        return this.reader.execute(slug, programId);
    }
}
