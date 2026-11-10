jest.mock('@umijs/max', () => ({
  defineConfig: (config: unknown) => config,
}));

it('injects the configured API, document and callback URLs as an object', () => {
  const savedEnvironment = { ...process.env };
  const expected = {
    apiBaseUrl: 'http://api.example.invalid:7511',
    documentBaseUrl: 'http://documents.example.invalid:7511',
    onlyOfficeCallbackBaseUrl: 'http://callback.example.invalid:7511',
    onlyOfficeServer: 'http://onlyoffice.example.invalid:7000',
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

it('defaults all service URLs to 192.168.0.87 without environment overrides', () => {
  const savedEnvironment = {...process.env};
  try {
    for (const name of ['REACT_APP_API_BASE_URL', 'REACT_APP_DOCUMENT_BASE_URL',
      'REACT_APP_ONLYOFFICE_CALLBACK_BASE_URL', 'REACT_APP_ONLYOFFICE_SERVER']) delete process.env[name];
    jest.isolateModules(() => {
      const config = require('../config/config').default;
      expect(config.define['process.env.APP_RUNTIME_CONFIG']).toEqual({
        apiBaseUrl: 'http://192.168.0.87:7511',
        documentBaseUrl: 'http://192.168.0.87:7511',
        onlyOfficeCallbackBaseUrl: 'http://192.168.0.87:7511',
        onlyOfficeServer: 'http://192.168.0.87:7000',
      });
    });
  } finally {process.env = savedEnvironment;}
});
