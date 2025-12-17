/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/__tests__/**', '!src/__mocks__/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  moduleNameMapper: {
    '^ghostty-web$': '<rootDir>/src/__mocks__/ghostty-web.ts',
    '^@jupyterlab/services$': '<rootDir>/src/__mocks__/@jupyterlab/services.ts',
    '^@jupyterlab/translation$': '<rootDir>/src/__mocks__/@jupyterlab/translation.ts',
    '^@lumino/coreutils$': '<rootDir>/src/__mocks__/@lumino/coreutils.ts',
    '^@lumino/domutils$': '<rootDir>/src/__mocks__/@lumino/domutils.ts',
    '^@lumino/messaging$': '<rootDir>/src/__mocks__/@lumino/messaging.ts',
    '^@lumino/signaling$': '<rootDir>/src/__mocks__/@lumino/signaling.ts',
    '^@lumino/widgets$': '<rootDir>/src/__mocks__/@lumino/widgets.ts'
  }
};
