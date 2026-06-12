import { favoriteStoreListResultSchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// ─── GET /users/me/favorite-stores 쿼리 DTO ──────────────────────────────────
// 쿼리 검증은 컨트롤러의 QueryZodValidationPipe(favoriteStoresQuerySchema)가 수행하고
// 파라미터 타입은 inferred type(FavoriteStoresQuery)을 쓴다. createZodDto 클래스를 @Query
// 타입으로 쓰면 글로벌 ValidationPipe(forbidNonWhitelisted)가 limit/cursor 를 거부하므로 두지 않음.

// ─── GET /users/me/favorite-stores 응답 DTO ──────────────────────────────────
// 응답 SSOT = @todam/shared(zod). Reconcile(2026-06-09) 후속으로 shared+FE 에서
// category 를 완전 제거(#255) → 손으로 유지하던 인터림 DTO를 createZodDto 로 전환.
export class ListFavoriteStoresResponseDto extends createZodDto(favoriteStoreListResultSchema) {}
