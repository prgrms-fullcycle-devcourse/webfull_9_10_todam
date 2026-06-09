import { ApiProperty } from '@nestjs/swagger';
import { favoriteStoresQuerySchema } from '@todam/shared';
import { createZodDto } from 'nestjs-zod';

// ─── GET /users/me/favorite-stores 쿼리 DTO ──────────────────────────────────
// 쿼리 SSOT = @todam/shared(zod).
export class ListFavoriteStoresQueryDto extends createZodDto(favoriteStoresQuerySchema) {}

// ─── GET /users/me/favorite-stores 응답 DTO (hand-written) ───────────────────
// NOTE: 응답 DTO는 손으로 유지한다. shared `favoriteStoreItemSchema` / `favoriteStoreListResultSchema`
// 에 `category`(필수)가 남아있으나 BE 는 Reconcile(2026-06-09) 결정으로 category 를 반환하지 않는다.
// createZodDto 로 전환하면 use-case 반환(category 없음)과 타입 충돌이 난다.
// shared + FE 의 category 완전 제거(FE 협의 후속) 완료 후 createZodDto(favoriteStoreListResultSchema)
// 로 전환 예정. — MyReservationItemDto(reservation) 선례와 동일 인터림 패턴.
export class FavoriteStoreItemDto {
    @ApiProperty({ description: 'FavoriteStore.id (찜 레코드 id)' }) favoriteId!: string;
    @ApiProperty({ description: 'Store.id' }) storeId!: string;
    @ApiProperty({ description: '공방명' }) name!: string;
    @ApiProperty({ description: '대표 이미지 URL (없으면 빈 문자열)' }) imageUrl!: string;
    @ApiProperty({ description: '주소' }) address!: string;
    @ApiProperty({ description: 'ISO 8601 (찜 등록 시각 = 정렬 기준)' }) createdAt!: string;
}

export class ListFavoriteStoresResponseDto {
    @ApiProperty({ type: [FavoriteStoreItemDto] }) favoriteStores!: FavoriteStoreItemDto[];
    @ApiProperty({ nullable: true, description: '다음 페이지 커서 (없으면 null)' })
    nextCursor!: string | null;
}
