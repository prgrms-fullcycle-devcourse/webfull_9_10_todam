/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: 'src',
    testRegex: '.*\\.spec\\.ts$',
    moduleFileExtensions: ['ts', 'js', 'json'],
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                tsconfig: {
                    // 테스트 컴파일에만 jest 타입을 노출 (런타임 tsconfig는 건드리지 않음).
                    types: ['node', 'jest'],
                },
            },
        ],
    },
};
