import { favoriteStoreListResultSchema, favoriteStoresQuerySchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// ─── GET /users/me/favorite-stores 쿼리 DTO ──────────────────────────────────
// 쿼리 SSOT = @todam/shared(zod).
export class ListFavoriteStoresQueryDto extends createZodDto(favoriteStoresQuerySchema) {}

// ─── GET /users/me/favorite-stores 응답 DTO ──────────────────────────────────
// 응답 SSOT = @todam/shared(zod). Reconcile(2026-06-09) 후속으로 shared+FE 에서
// category 를 완전 제거(#255) → 손으로 유지하던 인터림 DTO를 createZodDto 로 전환.
export class ListFavoriteStoresResponseDto extends createZodDto(favoriteStoreListResultSchema) {}
