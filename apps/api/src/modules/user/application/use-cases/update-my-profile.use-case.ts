import { HttpStatus, Injectable } from '@nestjs/common';
import type { UpdateMyProfileBody } from '@todam/shared';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { UpdateProfileData, UserRepository } from '../../domain/repositories/user.repository';
import type { UpdateMyProfileResponseDto } from '../../presentation/dto/user-me.dto';

@Injectable()
export class UpdateMyProfileUseCase {
    constructor(private readonly users: UserRepository) {}

    async execute(userId: string, body: UpdateMyProfileBody): Promise<UpdateMyProfileResponseDto> {
        // 1. 사용자 존재 및 ACTIVE 검증
        const user = await this.users.findById(userId);

        if (!user || user.status !== 'ACTIVE') {
            throw new BusinessException(
                'USER_NOT_FOUND',
                '존재하지 않거나 탈퇴 처리된 회원입니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 2. 닉네임이 전달된 경우에만 중복 검사 — 다른 유저가 동일 닉네임 사용 중이면 409
        //    본인 현재 닉네임과 동일하면 existsByNicknameExceptUser가 false를 반환 → 통과
        if (body.nickname !== undefined) {
            const isDuplicate = await this.users.existsByNicknameExceptUser(body.nickname, userId);

            if (isDuplicate) {
                throw new BusinessException(
                    'NICKNAME_ALREADY_EXISTS',
                    '이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.',
                    HttpStatus.CONFLICT,
                );
            }
        }

        // 3. 전달된 필드만 골라 갱신(undefined는 제외, null은 삭제로 전달).
        const data: UpdateProfileData = {};
        if (body.nickname !== undefined) data.nickname = body.nickname;
        if (body.reserverName !== undefined) data.reserverName = body.reserverName;
        if (body.reserverPhone !== undefined) data.reserverPhone = body.reserverPhone;

        const updated = await this.users.updateProfile(userId, data);

        return {
            user: {
                userId: updated.id,
                email: updated.email,
                nickname: updated.nickname,
                isPartner: updated.isPartner,
                reserverName: updated.reserverName,
                reserverPhone: updated.reserverPhone,
                updatedAt: updated.updatedAt.toISOString(),
            },
        };
    }
}
