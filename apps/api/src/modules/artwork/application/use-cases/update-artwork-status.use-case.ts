import { Injectable } from '@nestjs/common';
import type { UpdateArtworkStatusRequest } from '@todam/shared';
import { ArtworkRepository } from '../../domain/repositories/artwork.repository';

@Injectable()
export class UpdateArtworkStatusUseCase {
    constructor(private readonly artworks: ArtworkRepository) {}
    execute(userId: string, artworkId: string, dto: UpdateArtworkStatusRequest) {
        return this.artworks.updateStatus(userId, artworkId, dto);
    }
}
