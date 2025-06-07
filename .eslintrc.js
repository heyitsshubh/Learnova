module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint'],
  rules: {
    // Disable the "no-explicit-any" rule
    '@typescript-eslint/no-explicit-any': 'off',

    // Ensure hooks are used correctly
    'react-hooks/rules-of-hooks': 'error',

    // Add other rules as needed
    'react/react-in-jsx-scope': 'off', // For Next.js projects
  },
};