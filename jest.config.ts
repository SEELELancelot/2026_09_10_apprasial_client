import { configUmiAlias, createConfig } from '@umijs/max/test';

export default async () => {
  const config = await configUmiAlias({
    ...createConfig({
      target: 'browser',
    }),
  });
  console.log(JSON.stringify(config));

  return {
    ...config,
    transform: {
      // Existing .js components contain JSX, so use the JSX loader in tests.
      '^.+\\.jsx?$': [
        require.resolve('@umijs/test/dist/transformers/esbuild'),
        { target: 'es2020', sourcemap: true, loader: 'jsx' },
      ],
      ...config.transform,
    },
    testEnvironmentOptions: {
      ...(config?.testEnvironmentOptions || {}),
      url: 'http://localhost:8000',
    },
    setupFiles: [...(config.setupFiles || []), './tests/setupTests.jsx'],
    globals: {
      ...config.globals,
      'jest-esbuild': { jsx: 'automatic' },
      localStorage: null,
    },
  };
};
