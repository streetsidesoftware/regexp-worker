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
