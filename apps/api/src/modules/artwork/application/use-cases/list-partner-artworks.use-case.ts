import { Injectable } from '@nestjs/common';
import type { ListPartnerArtworksQuery } from '@todam/shared';
import { ArtworkRepository } from '../../domain/repositories/artwork.repository';

@Injectable()
export class ListPartnerArtworksUseCase {
    constructor(private readonly artworks: ArtworkRepository) {}
    execute(userId: string, storeId: string, query: ListPartnerArtworksQuery) {
        return this.artworks.list(userId, storeId, query);
    }
}
