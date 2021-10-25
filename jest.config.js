/* eslint-disable @typescript-eslint/no-var-requires */
const os = require('os');
const useTSJest = !process.env['TEST_JS'];

console.log(os.type())
let custom = {};

if (useTSJest) {
    console.log('test-ts');
    custom = {
        roots: ['./src'],
        transform: {
            '^.+\\.tsx?$': 'ts-jest'
        },
    }
} else {
    console.log('test-js');
    custom = { roots: ['./lib'], }
}

custom.maxConcurrency = 1;

module.exports = {
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec|perf))\\.[tj]sx?$',
    moduleFileExtensions: [
        'js',
        'jsx',
        'ts',
        'tsx',
    ],
    coverageReporters: [ 'json', 'lcov', 'text', 'clover', 'html' ],
    setupFilesAfterEnv: ['jest-extended/all'],
    ...custom,
}
