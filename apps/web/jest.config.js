const nextJest = require('next/jest');

// next/jest: SWC 트랜스폼·tsconfig paths(@/*)·env 로딩을 자동 구성한다.
const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
    testEnvironment: 'jest-environment-jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    // tsconfig paths(@/*) → jest 모듈 해석 매핑.
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    // 워크스페이스 UI 패키지는 빌드 없이 TSX 소스를 export하므로
    // 단위 테스트에서는 매뉴얼 모킹으로 대체(node_modules 트랜스폼 회피).
    testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
    clearMocks: true,
};

module.exports = createJestConfig(config);
