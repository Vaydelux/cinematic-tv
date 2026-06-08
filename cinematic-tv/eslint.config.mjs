import nextVitals from 'eslint-config-next/core-web-vitals';

const withoutReactRules = (config) => {
  if (!config.rules) {
    return config;
  }

  return {
    ...config,
    rules: Object.fromEntries(
      Object.entries(config.rules).filter(([ruleName]) => !ruleName.startsWith('react/')),
    ),
  };
};

const eslintConfig = [
  ...nextVitals.map(withoutReactRules),
  {
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    ignores: [
      '.next/**',
      'next-env.d.ts',
      'node_modules/**',
    ],
  },
];

export default eslintConfig;
