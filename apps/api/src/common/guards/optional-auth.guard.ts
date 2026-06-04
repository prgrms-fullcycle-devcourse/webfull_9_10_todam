import { Injectable } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import type { RequestUser } from '../types/request-user.type';

// 선택 인증 가드.
// - Authorization Bearer 가 유효하면 req.user 에 RequestUser 를 채운다.
// - 토큰이 없거나(비인증) 검증 실패하면 throw 하지 않고 req.user 를 undefined 로 둔다.
// 퍼블릭 엔드포인트에서 "있으면 반영, 없으면 게스트" 동작이 필요할 때 사용한다(예: 공방 상세 isFavorite).
@Injectable()
export class OptionalAuthGuard extends PassportAuthGuard('jwt') {
    // passport 가 user 를 못 만들거나 에러여도 통과시키고, 있으면 그대로 반환.
    handleRequest<TUser = RequestUser>(_err: unknown, user: TUser | false): TUser | undefined {
        return user || undefined;
    }
}
