// @ts-check
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // Enforce explicit TypeScript types — no any allowed.
      '@typescript-eslint/no-explicit-any': 'error',
      // Enforce awaiting all promises — catches fire-and-forget bugs.
      '@typescript-eslint/no-floating-promises': 'error',
      // Flag unused variables; allow underscore-prefixed intentional ones.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Warn when return types can be inferred but are omitted on public methods.
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
    },
  },
  {
    // Exclude generated output and third-party directories.
    ignores: ['node_modules/', 'playwright-report/', 'test-results/'],
  },
);
