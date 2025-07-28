const customJestConfig = {
    moduleFileExtensions: [
        "ts",
        "tsx",
        "js",
        "node",
        "json"
      ],
      testPathIgnorePatterns: [
        "/node_modules/"
      ],
      collectCoverage: true,
      collectCoverageFrom: [
        "src/**/*.ts",
        "src/**/*.js"
      ],
      moduleNameMapper: {
        "@src/([^\\.]*)$": "<rootDir>/src/$1",
        "^.+.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$": "jest-transform-stub"
      },
      transform: {
        '^.+\\.(js|jsx)$': 'babel-jest',
        '^.+\\.(ts|tsx)$': 'ts-jest',
        ".+\\.(css|styl|less|sass|scss|png|jpg|ttf|woff|woff2)$": "jest-transform-stub"
      },
      testRegex: "\\.(test|spec)\\.(js|ts)$",
      verbose: true,
      testEnvironment: "jest-environment-jsdom",
  };
  
  module.exports = {
    ...customJestConfig,
    transformIgnorePatterns: ["node_modules/(?!(preact))"],
  };