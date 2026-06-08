import { Injectable } from '@nestjs/common';
import type { UpdateArtworkDeliveryRequest } from '@todam/shared';
import { ArtworkRepository } from '../../domain/repositories/artwork.repository';

@Injectable()
export class UpdateArtworkDeliveryUseCase {
    constructor(private readonly artworks: ArtworkRepository) {}
    execute(userId: string, artworkId: string, dto: UpdateArtworkDeliveryRequest) {
        return this.artworks.updateDelivery(userId, artworkId, dto);
    }
}
