import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        chaiConfig: { truncateThreshold: 80 },
        projects: [
            {
                test: {
                    // test both .js and .ts files
                    include: ['out/**/*.test.{js,mjs}', 'src/**/*.test.*', 'src/**/*.spec.*', 'examples/**/*.test.*'],
                    exclude: ['**/temp/**', '**/node_modules/**', 'test-packages'],
                    name: 'unit',
                    environment: 'node',
                },
            },
        ],
        coverage: {
            // enabled: true,
            provider: 'istanbul',
            clean: true,
            all: true,
            reportsDirectory: 'coverage',
            extension: ['.js', '.mjs'],
            reporter: ['html', 'json', ['lcov', { projectRoot: __dirname }], 'text'],
            exclude: [
                '_snapshots_',
                '.coverage/**',
                '.eslint*',
                '.prettier*',
                '**/*.config.*',
                '**/*.d.cts',
                '**/*.d.mts',
                '**/*.d.ts',
                '**/*.perf.*',
                '**/*.test.*',
                '**/dist/**',
                '**/fixtures/**',
                '**/lib/**',
                '**/perf/**',
                '**/samples/**',
                '**/test.*',
                '**/test*/**',
                // '**/worker/workerCode*DataURL.*',
                '**/worker/workerCodeBrowser.*',
                '**/worker/workerCodeNode.*',
                '**/worker/workerCodeNodeTest.*',
                'coverage',
                'examples',
                'scripts',
                'vitest*',
                'workerTerminate.mjs',
            ],
        },
    },
});
