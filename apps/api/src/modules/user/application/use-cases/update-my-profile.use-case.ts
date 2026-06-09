import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { UserRepository } from '../../domain/repositories/user.repository';
import type { UpdateMyProfileResponseDto } from '../../presentation/dto/user-me.dto';

@Injectable()
export class UpdateMyProfileUseCase {
    constructor(private readonly users: UserRepository) {}

    async execute(userId: string, nickname: string): Promise<UpdateMyProfileResponseDto> {
        // 1. 사용자 존재 및 ACTIVE 검증
        const user = await this.users.findById(userId);

        if (!user || user.status !== 'ACTIVE') {
            throw new BusinessException(
                'USER_NOT_FOUND',
                '존재하지 않거나 탈퇴 처리된 회원입니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 2. 닉네임 중복 검사 — 다른 유저가 동일 닉네임 사용 중이면 409
        //    본인 현재 닉네임과 동일하면 existsByNicknameExceptUser가 false를 반환 → 통과
        const isDuplicate = await this.users.existsByNicknameExceptUser(nickname, userId);

        if (isDuplicate) {
            throw new BusinessException(
                'NICKNAME_ALREADY_EXISTS',
                '이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.',
                HttpStatus.CONFLICT,
            );
        }

        // 3. 닉네임 갱신
        const updated = await this.users.updateNickname(userId, nickname);

        return {
            user: {
                userId: updated.id,
                email: updated.email,
                nickname: updated.nickname,
                isPartner: updated.isPartner,
                updatedAt: updated.updatedAt.toISOString(),
            },
        };
    }
}
