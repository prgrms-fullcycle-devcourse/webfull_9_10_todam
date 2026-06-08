import { Injectable } from '@nestjs/common';
import { ArtworkRepository } from '../../domain/repositories/artwork.repository';

@Injectable()
export class ConfirmArtworkPhotoUseCase {
    constructor(private readonly artworks: ArtworkRepository) {}
    execute(userId: string, artworkId: string, photoId: string) {
        return this.artworks.confirmPhoto(userId, artworkId, photoId);
    }
}
