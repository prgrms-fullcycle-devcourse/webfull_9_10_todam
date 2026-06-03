// 정규식 패턴 단일 출처. contracts/fields.ts 의 zod 스키마가 여기서 가져다 씀.
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 휴대폰 전용 (회원가입 등)
export const PHONE_REGEX = /^010-\d{4}-\d{4}$/;
// 공방 연락처: 휴대폰/유선 모두 허용 (02-1234-5678, 010-1234-5678)
export const STORE_PHONE_REGEX = /^0\d{1,2}-\d{3,4}-\d{4}$/;

export const BUSINESS_NUMBER_REGEX = /^\d{3}-\d{2}-\d{5}$/;

// "HH:mm"
export const TIME_REGEX = /^\d{2}:\d{2}$/;

// URL slug: 영문 소문자·숫자·- 4~40자 (요구사항 정본. 언더스코어 불가)
export const SLUG_REGEX = /^[a-z0-9-]{4,40}$/;

// 비밀번호: 영문·숫자·특수문자 각 1+ 포함, 8~32자
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,32}$/;
