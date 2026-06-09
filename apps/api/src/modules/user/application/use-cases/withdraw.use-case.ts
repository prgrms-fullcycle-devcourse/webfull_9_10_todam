import { HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { WithdrawErrorCode } from '@todam/shared';
import type { WithdrawBody } from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class WithdrawUseCase {
    constructor(private readonly users: UserRepository) {}

    async execute(userId: string, body: WithdrawBody): Promise<void> {
        // 1. 유저 조회 + ACTIVE 상태 가드
        const user = await this.users.findWithdrawTarget(userId);

        if (!user || user.status !== 'ACTIVE') {
            throw new BusinessException(
                WithdrawErrorCode.USER_NOT_FOUND,
                '사용자를 찾을 수 없습니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 2. 파트너 보유 차단 (APPROVED & 미해지)
        const hasPartner = await this.users.hasActivePartner(userId);

        if (hasPartner) {
            throw new BusinessException(
                WithdrawErrorCode.ACTIVE_PARTNER_EXISTS,
                '파트너 해지 후 탈퇴가 가능합니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        // 3. 진행 중 예약 또는 작품 차단
        const [hasReservations, hasArtworks] = await Promise.all([
            this.users.hasActiveReservations(userId),
            this.users.hasActiveArtworks(userId),
        ]);

        if (hasReservations || hasArtworks) {
            throw new BusinessException(
                WithdrawErrorCode.ACTIVE_RESERVATIONS_OR_ARTWORKS_EXIST,
                '진행 중인 클래스 예약 또는 제작 중인 도자기 작품이 남아있어 탈퇴가 불가능합니다.',
                HttpStatus.BAD_REQUEST,
            );
        }

        // 4. 본인확인 — 이메일 유저: bcrypt 검증 / 소셜 유저: 생략
        if (user.password !== null) {
            // 이메일 유저
            if (!body.password) {
                throw new BusinessException(
                    WithdrawErrorCode.PASSWORD_MISMATCH,
                    '본인 확인을 위한 인증 정보가 일치하지 않습니다.',
                    HttpStatus.BAD_REQUEST,
                );
            }

            const isMatch = await bcrypt.compare(body.password, user.password);

            if (!isMatch) {
                throw new BusinessException(
                    WithdrawErrorCode.PASSWORD_MISMATCH,
                    '본인 확인을 위한 인증 정보가 일치하지 않습니다.',
                    HttpStatus.BAD_REQUEST,
                );
            }
        }
        // 소셜 유저(password === null): 본인확인 생략

        // 5. 탈퇴 트랜잭션 (users 익명화 + oauth_accounts 삭제 + refresh_tokens 삭제)
        await this.users.withdraw(userId);
    }
}
