module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: [
        "**/?(*.)+(spec|test).ts", // Match files with .spec.ts or .test.ts extension
        "!**/exclude/**", // Exclude files in the exclude directory
    ],
};
