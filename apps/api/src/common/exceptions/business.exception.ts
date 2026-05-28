import { HttpException } from '@nestjs/common';

// 도메인 비즈니스 규칙 위반 예외.
// errorCode(응답 봉투의 error 필드) + 메시지 + HTTP 상태를 함께 담는다.
// 예: throw new BusinessException('EMAIL_ALREADY_EXISTS', '이미 가입된 이메일입니다.', HttpStatus.CONFLICT);
export class BusinessException extends HttpException {
    constructor(
        public readonly errorCode: string,
        message: string,
        status: number,
    ) {
        super(message, status);
    }
}
