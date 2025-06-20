import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        chaiConfig: { truncateThreshold: 80 },
        // test both .js and .ts files
        include: ['out/**/*.test.{js,mjs}', 'src/**/*.test.*', 'src/**/*.spec.*'],
        exclude: ['**/temp/**', '**/node_modules/**'],
        coverage: {
            // enabled: true,
            provider: 'istanbul',
            clean: true,
            all: true,
            reportsDirectory: 'coverage',
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
                '**/worker/workerCodeNode.*',
                'coverage',
                'scripts',
                'vitest*',
                'workerTerminate.mjs',
            ],
        },
    },
});
