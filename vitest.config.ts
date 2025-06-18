import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        chaiConfig: { truncateThreshold: 80 },
        // cspell:ignore tsup
        exclude: ['**/temp/**', '**/node_modules/**', '**/*.ts'],
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
                '**/*.d.cts',
                '**/*.d.mts',
                '**/*.d.ts',
                '**/*.test.*',
                '**/*.config.*',
                '**/fixtures/**',
                '**/perf/**',
                '**/*.perf.*',
                '**/samples/**',
                '**/test*/**',
                '**/test.*',
                '**/lib/**',
                '**/worker/workerCodeNode.*',
                'scripts',
                'workerTerminate.mjs',
                'coverage',
                'vitest*',
            ],
        },
    },
});
