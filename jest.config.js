process.env['EMOJIS_FILE_PATH'] = './src/helpers/files/emojis.json';

module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    transform: {
        "^.+\\.ts?$": "ts-jest",
    },
    transformIgnorePatterns: ["<rootDir>/node_modules/"],
};
