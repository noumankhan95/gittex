module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./src/test/setup.ts'],
  moduleNameMapper: {
    '../nats-wrapper': '<rootDir>/src/test/__mocks__/nats-wrapper.ts',
  }
};