// https://umijs.org/config/
import {defineConfig} from '@umijs/max';
import defaultSettings from './defaultSettings';
import proxy from './proxy';
import routes from './routes';

const {REACT_APP_ENV = 'dev'} = process.env;

export default defineConfig({
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
        fontSize: 16
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
