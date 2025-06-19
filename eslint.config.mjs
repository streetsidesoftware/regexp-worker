// @ts-check

import eslint from '@eslint/js';
import tsEslint from 'typescript-eslint';
import globals from 'globals';

const __dirname = new URL('.', import.meta.url).href;

export default tsEslint.config(
    eslint.configs.recommended,
    tsEslint.configs.recommendedTypeChecked,
    { languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: __dirname } } },
    {
        ignores: [
            '**/*.d.ts',
            '**/node_modules/**',
            'lib/**/*.js',
            'dist',
            'eslint.*',
            'workerTerminate.mjs',
            '*.config.ts',
            'scripts',
            'index.js',
            'coverage',
        ],
    },
    {
        languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node } },
        rules: {
            // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
            quotes: ['warn', 'single', { avoidEscape: true }],
            'no-use-before-define': 'off',

            // e.g. "@typescript-eslint/explicit-function-return-type": "off",
            '@typescript-eslint/consistent-type-exports': ['error', { fixMixedExportsWithInlineTypeSpecifier: false }],
            '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'separate-type-imports', prefer: 'type-imports' }],
            '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-empty-interface': 'off',
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-inferrable-types': 'error',
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/no-redundant-type-constituents': 'off', // allowed to communicate expected type in a union with `unknown`
            '@typescript-eslint/no-unused-vars': ['warn', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-use-before-define': 'off', // this is a bit too aggressive.',
        },
    },
);
