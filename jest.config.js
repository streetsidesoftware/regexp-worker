/* eslint-disable @typescript-eslint/no-var-requires */
const os = require('os');
const useTSJest = !process.env['TEST_JS'];
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

if ((/windows/i).test(os.type())) {
    console.log(os.type())
    console.log('Max Concurrency set to 1')
    custom.maxConcurrency = 1;
} else {
    console.log(os.type())
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
    setupFilesAfterEnv: ['jest-extended'],
    ...custom,
}
