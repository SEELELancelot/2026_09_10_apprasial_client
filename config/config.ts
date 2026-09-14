// https://umijs.org/config/
import {defineConfig} from '@umijs/max';
import defaultSettings from './defaultSettings';
import proxy from './proxy';
import routes from './routes';

const {REACT_APP_ENV = 'dev'} = process.env;

// 網址只在建置時注入。本機 Docker Desktop 與區網部署使用不同位址：
// npm run dev -> localhost / host.docker.internal；npm run build -> 192.168.0.87。
// 環境變數仍可覆寫，讓未來搬遷主機時不必修改程式。
const isLanBuild = REACT_APP_ENV === 'production';
const defaultClientConfig = isLanBuild
  ? {
      apiBaseUrl: 'http://192.168.0.87:7511',
      documentBaseUrl: 'http://192.168.0.87:7511',
      onlyOfficeCallbackBaseUrl: 'http://192.168.0.87:7511',
      onlyOfficeServer: 'http://192.168.0.87:7000',
    }
  : {
      apiBaseUrl: 'http://localhost:7511',
      documentBaseUrl: 'http://host.docker.internal:7511',
      onlyOfficeCallbackBaseUrl: 'http://host.docker.internal:7511',
      onlyOfficeServer: 'http://localhost:7016',
    };

const clientConfig = {
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || defaultClientConfig.apiBaseUrl,
  documentBaseUrl:
    process.env.REACT_APP_DOCUMENT_BASE_URL || defaultClientConfig.documentBaseUrl,
  onlyOfficeCallbackBaseUrl:
    process.env.REACT_APP_ONLYOFFICE_CALLBACK_BASE_URL ||
    defaultClientConfig.onlyOfficeCallbackBaseUrl,
  onlyOfficeServer:
    process.env.REACT_APP_ONLYOFFICE_SERVER || defaultClientConfig.onlyOfficeServer,
};

export default defineConfig({
  define: {
    'process.env.APP_RUNTIME_CONFIG': JSON.stringify(clientConfig),
  },
  extraBabelPlugins: [process.env.NODE_ENV === 'production' ? 'transform-remove-console' : ''],

  esbuildMinifyIIFE: true,

  valtio: {},

  hash:true,

  // targets: {
  //   ie: 11,
  // },

  // umi routes: https://umijs.org/docs/routing
  routes,

  theme: {

    'root-entry-name': 'variable',
  },

  ignoreMomentLocale: true,

  proxy: proxy[REACT_APP_ENV as keyof typeof proxy],
  fastRefresh: true,

  model: {},

  initialState: {},

  // title: '客戶關係管理系統',
  layout: {
    locale: true,

    ...defaultSettings,
  },

  moment2dayjs: {
    preset: 'antd',
    plugins: ['duration'],
  },

  locale: {
    default: 'zh-TW',
    antd: true,
    // default true, when it is true, will use `navigator.language` overwrite default
    baseNavigator: false,
  },

  antd: {

    theme: {
      token: {
        fontSize: 16,
        // 關閉 Ant Design 元件的縮放／淡入動畫，Modal 第一幀即為最終尺寸。
        motion: false,
      },
    }
  },
  request: {},

  access: {},

  headScripts: [

  ],
  presets: ['umi-presets-pro'],

  requestRecord: {},
  //    /user\/.+/ ,/admin\/.+/
  links:[
    {rel:'shortcut icon',href:'./logo1.png'}
  ],
  //注意 大寫匹配不到
  keepalive: [
  ],     //注意不要包含第一級路由
});
