import { SetMetadata } from '@nestjs/common';

// 컨트롤러 핸들러의 성공 응답 메시지를 지정한다.
// 미지정 시 ResponseInterceptor가 기본 메시지를 사용한다.
// 예: @ResponseMessage('회원가입이 완료되었습니다.')
export const RESPONSE_MESSAGE_KEY = 'response_message';

export const ResponseMessage = (message: string): MethodDecorator & ClassDecorator =>
    SetMetadata(RESPONSE_MESSAGE_KEY, message);
