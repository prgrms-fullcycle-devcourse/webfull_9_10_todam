const { FlatCompat } = require('@eslint/eslintrc')
const base = require('./base')

const compat = new FlatCompat({ baseDirectory: __dirname })

module.exports = [
  { ignores: ['.next/**', 'node_modules/**'] },
  ...base,
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]