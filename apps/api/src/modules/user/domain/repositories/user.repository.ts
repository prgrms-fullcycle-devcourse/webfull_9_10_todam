/** GET /users/me 응답에 사용하는 프로필 행 */
export interface UserProfileRow {
    id: string;
    email: string;
    nickname: string;
    isPartner: boolean;
    status: string;
    createdAt: Date;
    updatedAt: Date;
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
}
