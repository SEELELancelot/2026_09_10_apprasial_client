jest.mock('@umijs/max', () => ({
  defineConfig: (config: unknown) => config,
}));

it('injects the configured API, document and callback URLs as an object', () => {
  const savedEnvironment = { ...process.env };
  const expected = {
    apiBaseUrl: 'http://localhost:7511',
    documentBaseUrl: 'http://192.168.0.185:7511',
    onlyOfficeCallbackBaseUrl: 'http://192.168.0.185:7511',
    onlyOfficeServer: 'http://192.168.0.87:7000',
  };
  try {
    process.env.REACT_APP_API_BASE_URL = expected.apiBaseUrl;
    process.env.REACT_APP_DOCUMENT_BASE_URL = expected.documentBaseUrl;
    process.env.REACT_APP_ONLYOFFICE_CALLBACK_BASE_URL = expected.onlyOfficeCallbackBaseUrl;
    process.env.REACT_APP_ONLYOFFICE_SERVER = expected.onlyOfficeServer;
    jest.isolateModules(() => {
      const config = require('../config/config').default;
      expect(config.define['process.env.APP_RUNTIME_CONFIG']).toEqual(expected);
    });
  } finally {
    process.env = savedEnvironment;
  }
});
