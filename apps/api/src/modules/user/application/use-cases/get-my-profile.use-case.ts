import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { UserRepository } from '../../domain/repositories/user.repository';
import type { GetMyProfileResponseDto } from '../../presentation/dto/user-me.dto';

@Injectable()
export class GetMyProfileUseCase {
    constructor(private readonly users: UserRepository) {}

    async execute(userId: string): Promise<GetMyProfileResponseDto> {
        const user = await this.users.findById(userId);

        if (!user || user.status !== 'ACTIVE') {
            throw new BusinessException(
                'USER_NOT_FOUND',
                '존재하지 않거나 탈퇴 처리된 회원입니다.',
                HttpStatus.NOT_FOUND,
            );
        }

        return {
            user: {
                userId: user.id,
                email: user.email,
                nickname: user.nickname,
                isPartner: user.isPartner,
                hasPassword: user.hasPassword,
                createdAt: user.createdAt.toISOString(),
            },
        };
    }
}
