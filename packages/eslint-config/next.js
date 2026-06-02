const base = require('./base')
const nextConfig = require('eslint-config-next/core-web-vitals')

module.exports = [
  { ignores: ['.next/**', 'node_modules/**'] },
  ...base,
  ...(Array.isArray(nextConfig) ? nextConfig : [nextConfig]),
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]