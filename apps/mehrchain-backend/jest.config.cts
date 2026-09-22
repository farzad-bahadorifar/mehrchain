module.exports = {
  displayName: 'mehrchain-backend',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^@nestjs/jwt$': '<rootDir>/src/testing/jwt.mock.ts',
    '^@nestjs/schedule$': '<rootDir>/src/testing/schedule.mock.ts',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/mehrchain-backend',
};
