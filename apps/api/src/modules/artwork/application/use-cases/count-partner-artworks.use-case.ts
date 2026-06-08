import { Injectable } from '@nestjs/common';
import type { CountPartnerArtworksQuery } from '@todam/shared';
import { ArtworkRepository } from '../../domain/repositories/artwork.repository';

@Injectable()
export class CountPartnerArtworksUseCase {
    constructor(private readonly artworks: ArtworkRepository) {}
    execute(userId: string, query: CountPartnerArtworksQuery) {
        return this.artworks.count(userId, query);
    }
}
