// https://umijs.org/config/
import {defineConfig} from '@umijs/max';
import defaultSettings from './defaultSettings';
import proxy from './proxy';
import routes from './routes';

const {REACT_APP_ENV = 'production'} = process.env;

// API、文件與 OnlyOffice 預設統一連到 192.168.0.87。
// 環境變數仍可覆寫，日後搬遷主機不需要再次修改程式碼。
const defaultClientConfig = {
  apiBaseUrl: 'http://192.168.0.87:7511',
  documentBaseUrl: 'http://192.168.0.87:7511',
  onlyOfficeCallbackBaseUrl: 'http://192.168.0.87:7511',
  onlyOfficeServer: 'http://192.168.0.87:7000',
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
    // Umi serializes define values; keep this an object for property access.
    'process.env.APP_RUNTIME_CONFIG': clientConfig,
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
