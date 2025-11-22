/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // if you have other config, keep it; just add these:
  roots: ["<rootDir>/src"],

  testMatch: ["**/__tests__/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/lambda-package/"],
  modulePathIgnorePatterns: ["<rootDir>/lambda-package/"],

  // keep whatever else was there (transform, preset, etc.)
};
