module.exports = {
    testEnvironment: "jsdom",
    transform: {
        "^.+\\.js$": "babel-jest",
    },
    testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],
    collectCoverageFrom: [
        "js/**/*.js",
        "!js/**/*.test.js",
    ],
};
