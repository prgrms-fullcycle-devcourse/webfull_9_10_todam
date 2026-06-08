import { Injectable } from '@nestjs/common';
import { ArtworkRepository } from '../../domain/repositories/artwork.repository';

@Injectable()
export class GetPartnerArtworkDetailUseCase {
    constructor(private readonly artworks: ArtworkRepository) {}
    execute(userId: string, artworkId: string) {
        return this.artworks.detail(userId, artworkId);
    }
}
