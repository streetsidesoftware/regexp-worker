const useTSJest = !process.env['TEST_JS'];

if (useTSJest) {
    console.log('test-ts');
    module.exports = {
        roots: [
            './src'
        ],
        transform: {
            '^.+\\.tsx?$': 'ts-jest'
        },
        testRegex: '(/__tests__/.*|(\\.|/)(test|spec|perf))\\.tsx?$',
        coverageReporters: [ 'json', 'lcov', 'text', 'clover', 'html' ],
        moduleFileExtensions: [
            'ts',
            'tsx',
            'js',
            'jsx',
            'json',
            'node'
        ],
    }
} else {
    console.log('test-js');
    module.exports = {
        roots: [
            './lib'
        ],
        testRegex: '(/__tests__/.*|(\\.|/)(test|spec|perf))\\.jsx?$',
        moduleFileExtensions: [
            'js',
            'jsx',
            'ts',
            'tsx',
        ],
        coverageReporters: [ 'json', 'lcov', 'text', 'clover', 'html' ]
    }
}
