import { ReservationStatus } from '@prisma/client';

// ─── findReservationForReview 결과 ───────────────────────────────────
export interface ReservationForReview {
    userId: string | null;
    storeId: string;
    scheduledAt: Date;
    status: ReservationStatus;
}

// ─── ReviewPhoto 입력(create/update 공통) ────────────────────────────
export interface ReviewPhotoInput {
    imageUrl: string;
    thumbnailUrl: null;
    sortOrder: number;
}

// ─── createReviewWithPhotos 입력 ─────────────────────────────────────
export interface CreateReviewInput {
    reservationId: string;
    userId: string;
    storeId: string;
    rating: number;
    content: string | null;
    photos: ReviewPhotoInput[];
}

// ─── createReviewWithPhotos / findReviewWithPhotos 결과 ─────────────
export interface ReviewRow {
    id: string;
    reservationId: string;
    userId: string;
    rating: number;
    content: string | null;
    photos: ReviewPhotoRow[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ReviewPhotoRow {
    id: string;
    imageUrl: string;
    sortOrder: number;
}

// ─── updateReviewWithPhotos 입력 ─────────────────────────────────────
export interface UpdateReviewInput {
    rating: number;
    content: string | null;
    photos: ReviewPhotoInput[];
}

export abstract class ReviewRepository {
    /** 리뷰 작성 가능 여부 검증에 필요한 예약 정보를 조회한다. */
    abstract findReservationForReview(reservationId: string): Promise<ReservationForReview | null>;

    /** reservationId 에 연결된 리뷰가 이미 존재하는지 확인한다(unique 제약). */
    abstract existsReviewByReservation(reservationId: string): Promise<boolean>;

    /** Review + ReviewPhoto 를 트랜잭션으로 생성한다. */
    abstract createReviewWithPhotos(input: CreateReviewInput): Promise<ReviewRow>;

    /** Review + ReviewPhoto 를 photos sortOrder ASC 로 조회한다. */
    abstract findReviewWithPhotos(reviewId: string): Promise<ReviewRow | null>;

    /** rating·content 갱신 + review_photos 전량 삭제 후 재생성(트랜잭션). */
    abstract updateReviewWithPhotos(reviewId: string, input: UpdateReviewInput): Promise<ReviewRow>;

    /** reservationId 로 Review + photos(sortOrder ASC)를 조회한다. 상세 조회 전용. */
    abstract findReviewByReservationWithPhotos(reservationId: string): Promise<ReviewRow | null>;

    /** Review + ReviewPhoto 를 트랜잭션으로 hard-delete 한다. */
    abstract deleteReviewCascade(reviewId: string): Promise<void>;
}
