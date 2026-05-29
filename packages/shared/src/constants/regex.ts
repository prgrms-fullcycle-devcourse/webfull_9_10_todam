export const PHONE_REGEX = /^010-\d{4}-\d{4}$/;
export const BUSINESS_NUMBER_REGEX = /^\d{3}-\d{2}-\d{5}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 영문 + 숫자 + 특수문자 조합, 8~32자
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,32}$/;
