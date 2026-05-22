/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    './base.js',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'next/core-web-vitals',
  ],
  plugins: ['react', 'react-hooks'],
  rules: {
    // Next.js App Router에서는 react import 불필요
    'react/react-in-jsx-scope': 'off',
    // img 태그 대신 next/image 강제
    '@next/next/no-img-element': 'error',
    // hooks 규칙
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}