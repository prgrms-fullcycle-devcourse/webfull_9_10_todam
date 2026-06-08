import { Injectable } from '@nestjs/common';
import type { UpdateArtworkDeliveryInfoRequest } from '@todam/shared';
import { ArtworkRepository } from '../../domain/repositories/artwork.repository';

@Injectable()
export class UpdateArtworkDeliveryInfoUseCase {
    constructor(private readonly artworks: ArtworkRepository) {}
    execute(userId: string, artworkId: string, dto: UpdateArtworkDeliveryInfoRequest) {
        return this.artworks.updateDeliveryInfo(userId, artworkId, dto);
    }
}
