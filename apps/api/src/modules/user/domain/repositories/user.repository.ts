/** GET /users/me 응답에 사용하는 프로필 행 */
export interface UserProfileRow {
    id: string;
    email: string;
    nickname: string;
    isPartner: boolean;
    hasPassword: boolean;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

/** 회원탈퇴 가능 여부 확인용 최소 필드 */
export interface WithdrawTargetRow {
    id: string;
    password: string | null;
    status: string;
}

export abstract class UserRepository {
    /** userId로 유저 단건 조회. 없으면 null. */
    abstract findById(userId: string): Promise<UserProfileRow | null>;

    /**
     * 닉네임 중복 확인 — 해당 닉네임을 사용 중인 다른 유저가 있으면 true.
     * excludeUserId 본인은 제외(본인 현재 닉네임 = 무충돌).
     */
    abstract existsByNicknameExceptUser(nickname: string, excludeUserId: string): Promise<boolean>;

    /** 닉네임 수정 후 최신 유저 반환. */
    abstract updateNickname(userId: string, nickname: string): Promise<UserProfileRow>;

    // ─── 회원탈퇴 ─────────────────────────────────────────────────────────────

    /** 탈퇴 처리를 위한 유저 조회(password·status만). ACTIVE가 아니면 null 취급. */
    abstract findWithdrawTarget(userId: string): Promise<WithdrawTargetRow | null>;

    /** APPROVED + terminatedAt=null 파트너 보유 여부 */
    abstract hasActivePartner(userId: string): Promise<boolean>;

    /**
     * 비종료 예약 존재 여부.
     * 종료 상태 = CANCELED | DELIVERED | PICKUP_DONE — 그 외는 진행 중으로 간주.
     */
    abstract hasActiveReservations(userId: string): Promise<boolean>;

    /**
     * 비종료 작품 존재 여부 (예약 경유).
     * 종료 상태 = COMPLETED | CANCELED — 그 외는 제작 진행 중으로 간주.
     */
    abstract hasActiveArtworks(userId: string): Promise<boolean>;

    /**
     * 회원탈퇴 트랜잭션.
     * - users: status=WITHDRAWN, withdrawnAt=now(), email/nickname 익명화(sha256 해시), password=null
     * - oauth_accounts(userId): deleteMany
     * - refresh_tokens(userId): deleteMany
     */
    abstract withdraw(userId: string): Promise<void>;
}
