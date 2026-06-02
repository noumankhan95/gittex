module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterFramework: ['./src/test/setup.ts'],
  moduleNameMapper: {
    '../nats-wrapper': '<rootDir>/src/test/__mocks__/nats-wrapper.ts',
  },
};