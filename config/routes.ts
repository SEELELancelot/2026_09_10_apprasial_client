import ROUTENAME from './routesName'

export default [
  {
    path: ROUTENAME.Login,
    name: "login",
    layout: false,
    component: './Login',
  },

  //登入有經過LoginGetInitData
  {
    path: ROUTENAME.LoginGetInitData,
    name: "LoginGetInitData",
    layout: false,
    component: './LoginGetInitData/LoginGetInitData',
  },
  {
    path: ROUTENAME.employee_appraisalTabs,
    name: "主管",
    layout: true,
    component: './User/employeeAppraisal/employeeAppraisal',
  },
  {
    path: ROUTENAME.CreateAppraisalRecordExcel,
    name: "新建考核表",
    layout: false,
    component: './Excel/createAppraisalRecordExcel/createAppraisalRecordExcel',
  },
  {
    path:ROUTENAME.PreviewAppraisalRecordExcel,
    name:"預覽考核表",
    layout: false,
    component: "./Excel/PreviewAppraisalRecordExcel/PreviewAppraisalRecordExcel"
  },
  {
    path:ROUTENAME.MergeAppraisalRecordExcel,
    name:"合併考核總表",
    layout: false,
    component: "./Excel/MergeAppraisalRecordExcel/MergeAppraisalRecordExcel"
  },

  {
    path:ROUTENAME.MergeYearAppraisalRecordExcel,
    name:"合併年終考核總表",
    layout: false,
    component: "./Excel/MergeYearAppraisalRecordExcel/MergeYearAppraisalRecordExcel"
  },

  {
    path:ROUTENAME.CreateYearAppraisalRecordExcel,
    name:"新建年終表",
    layout: false,
    component: "./Excel/AppraisalYearExcel/createAppraisalYearExcel/createAppraisalYearExcel"
  },

  {
    path:ROUTENAME.PreviewYearAppraisalRecordExcel,
    name:"預覽年終考核表",
    layout: false,
    component: "./Excel/PreviewYearAppraisalRecordExcel/PreviewYearAppraisalRecordExcel"
  },

  {
    path:ROUTENAME.CreateHolidayBonusExcel,
    name:"創建假日發放獎金調查",
    layout: false,
    component: "./Excel/CreateHolidayBonusExcel/CreateHolidayBonusExcel"
  },
  {
    path:ROUTENAME.CreateHolidayAutExcel,
    name:"創建中秋發放獎金調查",
    layout: false,
    component: "./Excel/CreateHolidayAutExcel/CreateHolidayAutExcel"

  },
  {
    path:ROUTENAME.PreviewAppraisalBonusExcel,
    name: "預覽獎金調查表",
    layout: false,
    component: "./Excel/PreviewAppraisalBonusExcel/PreviewAppraisalBonusExcel"
  },
  {
    path:ROUTENAME.PreviewAppraisalAutExcel,
    name: "預覽中秋獎金調查表",
    layout: false,
    component: "./Excel/PreviewAppraisalAutExcel/PreviewAppraisalAutExcel"
  },
  {
    path:ROUTENAME.MergeBonusRecordExcel,
    name: "合併獎金調查",
    layout: false,
    component: "./Excel/MergeBonusRecordExcel/MergeBonusRecordExcel"
  },
  {
    path:ROUTENAME.MergeAutBonusRecordExcel,
    name: "合併中秋獎金調查",
    layout: false,
    component: "./Excel/MergeAutBonusRecordExcel/MergeAutBonusRecordExcel"
  },
  {
    path: '/',
    layout: false,
    redirect: '/login',
  },//根目錄跳轉登入
  {
    path: '*',
    layout: false,
    component: './404',
  },
];
