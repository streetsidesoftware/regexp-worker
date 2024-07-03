// @ts-check

import eslint from '@eslint/js';
import tsEslint from 'typescript-eslint';
import globals from 'globals';

export default tsEslint.config(
    eslint.configs.recommended,
    ...tsEslint.configs.recommended,
    {
        ignores: ['**/*.d.ts', '**/node_modules/**', 'lib/**/*.js'],
    },
    {
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
            },
        },
        rules: {
            // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
            quotes: ['warn', 'single', { avoidEscape: true }],

            // e.g. "@typescript-eslint/explicit-function-return-type": "off",
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-use-before-define': 'off',
            '@typescript-eslint/no-empty-interface': 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
        },
    },
);
