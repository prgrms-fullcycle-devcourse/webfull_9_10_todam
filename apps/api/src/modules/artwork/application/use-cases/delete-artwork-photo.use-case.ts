import { Injectable } from '@nestjs/common';
import { ArtworkRepository } from '../../domain/repositories/artwork.repository';

@Injectable()
export class DeleteArtworkPhotoUseCase {
    constructor(private readonly artworks: ArtworkRepository) {}
    execute(userId: string, artworkId: string, photoId: string) {
        return this.artworks.deletePhoto(userId, artworkId, photoId);
    }
}
