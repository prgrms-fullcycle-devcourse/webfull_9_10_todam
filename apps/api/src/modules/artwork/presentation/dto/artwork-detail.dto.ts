import { artworkDetailResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// GET /artworks/:artworkId 응답 DTO.
// SSOT = packages/shared/src/contracts/artwork-detail.ts (artworkDetailResultSchema).
// 임의 변경 금지 — shared contract가 정본.
export class ArtworkDetailResponseDto extends createZodDto(artworkDetailResultSchema) {}
