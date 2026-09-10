import { ProLayoutProps } from '@ant-design/pro-components';
const Settings: ProLayoutProps & {
  pwa?: boolean;
} = {
  menu:{
    defaultOpenAll:true,
  },

  locale: 'zh-TW',
  logo:null,
  navTheme: 'light',
  colorPrimary: '#317bf1',
  layout: 'mix',
  contentWidth: 'Fluid',
  fixedHeader: false,
  fixSiderbar: true,
  colorWeak: true,
  siderMenuType: 'sub',
  splitMenus: false,
  pwa: true,
  iconfontUrl: '',
  title: '員工考核',
  siderWidth:150, //側邊寬度
  onMenuHeaderClick:()=>{
    return null;
  },
  token: {
    bgLayout: '#f6ffed',

    sider: {
      colorBgCollapsedButton: '#fff',
      colorTextCollapsedButtonHover: '#1677ff',
      colorTextCollapsedButton: '#000',
      colorMenuBackground: '#f6ffed',
      colorMenuItemDivider: '#b7eb8f',
      colorBgMenuItemHover: '#71f6f6',
      colorBgMenuItemActive: '#fff',
      colorBgMenuItemSelected: '#71f6f6',
      colorTextMenuSelected: '#000',
      colorTextMenuItemHover: '#1677ff',
      colorTextMenuActive: '#000',
      colorTextMenu: '#000',
      colorTextMenuTitle: '#000',
    },
    header: {
      colorBgHeader: '#f6ffed',
      colorHeaderTitle: '#000',
      colorTextMenu: '#000',
      colorTextMenuSecondary: 'red',
      colorBgRightActionsItemHover: '#eee',
      colorTextRightActionsItem: '#000',
    },

    pageContainer: {
      colorBgPageContainer: '#fff',
      colorBgPageContainerFixed: 'red',
    },
  },
};
export default Settings;
