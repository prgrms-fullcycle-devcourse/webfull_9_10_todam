import { z } from 'zod';

import {
    BUSINESS_NUMBER_REGEX,
    EMAIL_REGEX,
    PASSWORD_REGEX,
    SLUG_REGEX,
    STORE_PHONE_REGEX,
    TIME_REGEX,
} from '../constants/regex';

// 재사용 필드 스키마 (도메인 contract·web 폼·api 공통).
// 패턴은 constants/regex.ts 단일 출처에서 가져옴. 스키마 = 패턴 + 메시지.
// 도메인별 composite(요청/응답)는 각 도메인 파일에서 이걸 조립.

export const emailSchema = z.string().regex(EMAIL_REGEX, '이메일 형식이 아닙니다.');
export const phoneSchema = z
    .string()
    .regex(STORE_PHONE_REGEX, '전화번호 형식(02-1234-5678)이 아닙니다.');
export const timeSchema = z.string().regex(TIME_REGEX, 'HH:mm 형식이어야 합니다.');
export const slugSchema = z.string().regex(SLUG_REGEX, '영문 소문자·숫자·-·_ 3~30자');
export const businessNumberSchema = z
    .string()
    .regex(BUSINESS_NUMBER_REGEX, '사업자등록번호 형식(000-00-00000)이 아닙니다.');
export const passwordSchema = z
    .string()
    .regex(PASSWORD_REGEX, '영문·숫자·특수문자를 포함해 8~32자로 입력해주세요.');

// 인증 코드 (이메일/SMS): 값 = 검증 + UI(input 칸 수) 공통
export const CODE_LENGTH = 6;
export const verifyCodeSchema = z
    .string()
    .length(CODE_LENGTH, `${CODE_LENGTH}자리 숫자를 입력해주세요.`)
    .regex(/^\d+$/, '숫자만 입력해주세요.');
