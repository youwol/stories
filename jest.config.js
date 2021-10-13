module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  reporters: [ "default", "jest-junit"],
  modulePathIgnorePatterns : [
    "/dist", 
    // if included jest complains about top-level await
    "/app/main.ts"
  ]
};