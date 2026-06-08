import { Injectable } from '@nestjs/common';
import type { BulkUpdateArtworkStatusRequest } from '@todam/shared';
import { ArtworkRepository } from '../../domain/repositories/artwork.repository';

@Injectable()
export class BulkUpdateArtworkStatusUseCase {
    constructor(private readonly artworks: ArtworkRepository) {}
    execute(userId: string, dto: BulkUpdateArtworkStatusRequest) {
        return this.artworks.bulkUpdateStatus(userId, dto);
    }
}
