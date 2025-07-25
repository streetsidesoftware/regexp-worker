import js from '@eslint/js';
import globals from 'globals';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import svelte from 'eslint-plugin-svelte';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

export default ts.config(
    js.configs.recommended,
    ...ts.configs.recommended,
    ...svelte.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            }
        }
    },
    {
        files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
        // See more details at: https://typescript-eslint.io/packages/parser/
        languageOptions: {
            parserOptions: {
                projectService: true,
                extraFileExtensions: ['.svelte'], // Add support for additional file extensions, such as .svelte
                parser: ts.parser,
                // Specify a parser for each language, if needed:
                // parser: {
                //   ts: ts.parser,
                //   js: espree,    // Use espree for .js files (add: import espree from 'espree')
                //   typescript: ts.parser
                // },

                // We recommend importing and specifying svelte.config.js.
                // By doing so, some rules in eslint-plugin-svelte will automatically read the configuration and adjust their behavior accordingly.
                // While certain Svelte settings may be statically loaded from svelte.config.js even if you don’t specify it,
                // explicitly specifying it ensures better compatibility and functionality.
                svelteConfig
            }
        }
    },
    {
        rules: {
            // Override or add rule settings here, such as:
            // 'svelte/rule-name': 'error'
        }
    },
    {
        plugins: {
            'simple-import-sort': simpleImportSort,
            svelte: svelte
        },
        rules: {
            'simple-import-sort/imports': 'warn',
            'simple-import-sort/exports': 'warn',
            'svelte/no-at-html-tags': 'error'
        }
    },
    {
        ignores: [
            '.svelte-kit',
            '**/*.d.ts',
            '**/node_modules/**',
            'dist',
            'out',
            'build',
            'eslint.*',
            'examples',
            'test-packages',
            '*.config.ts',
            'scripts',
            'coverage'
        ]
    },
    {
        rules: {
            '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }]
        }
    }
);
