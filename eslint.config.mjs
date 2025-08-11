import expo from 'eslint-config-expo/flat.js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  ...expo,
  prettierConfig,
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      'react/jsx-no-comment-textnodes': 'error',
      'no-undef': 'error',
      'no-extra-semi': 'error',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
      'no-dupe-keys': 'off'
    }
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-undef': 'off'
    }
  }
];
