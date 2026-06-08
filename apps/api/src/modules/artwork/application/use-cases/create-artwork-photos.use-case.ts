import { Injectable } from '@nestjs/common';
import type { CreateArtworkPhotosRequest } from '@todam/shared';
import { ArtworkRepository } from '../../domain/repositories/artwork.repository';

@Injectable()
export class CreateArtworkPhotosUseCase {
    constructor(private readonly artworks: ArtworkRepository) {}
    execute(userId: string, artworkId: string, dto: CreateArtworkPhotosRequest) {
        return this.artworks.createPhotos(userId, artworkId, dto);
    }
}
