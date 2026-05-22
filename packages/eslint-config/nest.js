/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./base.js'],
  rules: {
    // NestJS는 데코레이터를 많이 써서 any가 불가피한 경우가 있음
    '@typescript-eslint/no-explicit-any': 'off',
    // NestJS DI에서 빈 생성자 허용
    '@typescript-eslint/no-empty-function': 'off',
    // 인터페이스 강제 (NestJS 컨벤션)
    '@typescript-eslint/explicit-function-return-type': 'warn',
  },
}