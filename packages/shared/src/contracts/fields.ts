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
export const slugSchema = z.string().regex(SLUG_REGEX, '영문 소문자·숫자·- 4~40자');
export const businessNumberSchema = z
    .string()
    .regex(BUSINESS_NUMBER_REGEX, '사업자등록번호 형식(000-00-00000)이 아닙니다.');
export const passwordSchema = z
    .string()
    .regex(PASSWORD_REGEX, '영문·숫자·특수문자를 포함해 8~32자로 입력해주세요.');

// 개업일자: "YYYYMMDD" 8자리 + 실제 달력 날짜 검증(20261399·20260230 등 비정상 날짜 거부).
export const businessStartDateSchema = z
    .string()
    .regex(/^\d{8}$/, '개업일자는 YYYYMMDD 8자리 숫자여야 합니다.')
    .refine((v) => {
        const y = Number(v.slice(0, 4));
        const m = Number(v.slice(4, 6));
        const d = Number(v.slice(6, 8));
        if (m < 1 || m > 12 || d < 1 || d > 31) return false;
        // Date 롤오버로 실제 존재 여부 확인(예: 2월 30일 → 3월로 넘어가 불일치).
        const dt = new Date(Date.UTC(y, m - 1, d));
        return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
    }, '실제 존재하는 날짜(YYYYMMDD)여야 합니다.');

// 인증 코드 (이메일/SMS): 값 = 검증 + UI(input 칸 수) 공통
export const CODE_LENGTH = 6;
export const verifyCodeSchema = z
    .string()
    .length(CODE_LENGTH, `${CODE_LENGTH}자리 숫자를 입력해주세요.`)
    .regex(/^\d+$/, '숫자만 입력해주세요.');
