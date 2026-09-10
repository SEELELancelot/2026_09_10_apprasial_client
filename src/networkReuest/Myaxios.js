import axios from 'axios';

const ExcelAddPassword = `my55phmelu-436ymyu36ykmq[q;APjk5(&`;

let serverPort = 7511;
let mybaseUrl = ``;

let AppraisalRecordExcelCallback = `office/AppraisalRecordExcelCallback`;
const AppraisalYearRecordExcelCallback = `office/AppraisalYearRecordExcelCallback`;

const AppraisalBonusExcelCallBack = `office/AppraisalBonusExcelCallBack`;
const AppraisalAutExcelCallBack = `office/AppraisalAutExcelCallBack`;

let EmployeeAppraisalExcelDirectory = `office/excel/EmployeeAppraisalExcelManager`;
let EmployeeYearAppraisalExcelDirectory = `office/excel/EmployeeAppraisalExcelYear`;
let EmployeeBonusExcelDirectory = `office/excel/EmployeeBonusExcel`;
let EmployeeAutExcelDirectory = `office/excel/EmployeeAutExcel`;

let onlyOfficeServer = ``;
let documentUrl = `http://192.168.0.87:${serverPort}`;

if (window.location.host.indexOf('192.168') > -1) {
  mybaseUrl = `http://192.168.0.87:${serverPort}`;
  documentUrl = `http://192.168.0.87:${serverPort}`;
  onlyOfficeServer = 'http://192.168.0.87:7000';
} else if (window.location.host.indexOf('localhost') > -1) {
  mybaseUrl = `http://192.168.0.185:${serverPort}`;
  documentUrl = `http://192.168.0.185:${serverPort}`;
  onlyOfficeServer = 'http://192.168.0.87:7000';
} else {
  mybaseUrl = `http://192.168.0.87:${serverPort}`;
  documentUrl = `http://192.168.0.87:${serverPort}`;
  onlyOfficeServer = 'http://192.168.0.87:7000';
}

const axiosInstance = axios.create({
  baseURL: mybaseUrl,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.log(error);
    return Promise.reject(error);
  },
);

/**
 * ✅ 統一處理列表查詢參數
 *
 * 支援：
 * getAppraisalTable("115")
 *
 * getAppraisalTable({
 *   year: "115",
 *   statusMode: "all",
 * })
 */
const normalizeTableParams = (params = {}) => {
  if (typeof params !== 'object' || params === null) {
    return {
      year: params || '',
      statusMode: 'all',
    };
  }

  return {
    year: params.year || '',
    statusMode: params.statusMode || 'all',
  };
};

const axiosLogin = async (account, password) => {
  const result = await axiosInstance.post('login', {
    account,
    password,
  });

  return result;
};

const createEmployeeAppraisalExcel = async () => {
  const result = await axiosInstance.post('office/exportExcel');
  return result;
};

const createEmployeeYearFinalAppraisalExcel = async () => {
  const result = await axiosInstance.post('office/exportYearFinalExcel');
  return result;
};
// 端午獎金
const createExportBonusExcel = async () => {
  const result = await axiosInstance.post('office/exportBonusExcel');
  return result;
};

// 中秋獎金
const createExportAutExcel = async () => {
  const result = await axiosInstance.post('office/exportBonusAutExcel');
  return result;
};

/**
 * ✅ 平時考核列表
 *
 * 原本只吃 year：
 * getAppraisalTable("115")
 *
 * 現在也支援：
 * getAppraisalTable({
 *   year: "115",
 *   statusMode: "all",
 * })
 */
const getAppraisalTable = async (params = {}) => {
  const query = normalizeTableParams(params);

  const result = await axiosInstance.get('office/getAppraisalTable', {
    params: query,
  });

  return result;
};

/**
 * ✅ 年度考核列表
 *
 * 先一起支援 statusMode。
 * 之後年度考核接簽核流程時不用再改。
 */
const getYearAppraisalTableFetch = async (params = {}) => {
  const query = normalizeTableParams(params);

  const result = await axiosInstance.get('office/getYearAppraisalTableFetch', {
    params: query,
  });

  return result;
};

/**
 * ✅ 端午獎金列表
 */
const getBonusExcelTable = async (params = {}) => {
  const query = normalizeTableParams(params);

  const result = await axiosInstance.get('office/getBonusTableFetch', {
    params: query,
  });

  return result;
};

/**
 * ✅ 中秋獎金列表
 */
const getBonusAutTable = async (params = {}) => {
  const query = normalizeTableParams(params);

  const result = await axiosInstance.get('office/getBonusAutTableFetch', {
    params: query,
  });

  return result;
};

const getExcelNameById = async (id) => {
  const result = await axiosInstance.post('office/getExcelNameById', {
    documentId: id,
  });

  return result;
};

// 下載前先要求 ONLYOFFICE 將目前編輯中的內容寫回伺服器 Excel。
const prepareLatestExcelDownload = async (excelId) => {
  const result = await axiosInstance.post('office/prepareLatestExcelDownload', {
    excelId,
  });

  return result;
};

const deleteExcelById = async (id) => {
  const result = await axiosInstance.post('office/deleteExcelById', {
    deleteDocumentId: id,
  });

  return result;
};

const deleteYearExcelById = async (id) => {
  const result = await axiosInstance.post('office/deleteYearExcelById', {
    deleteDocumentId: id,
  });

  return result;
};

const deleteBonusById = async (id) => {
  const result = await axiosInstance.post('office/deleteBonusById', {
    deleteDocumentId: id,
  });

  return result;
};

const deleteAutBonusById = async (id) => {
  const result = await axiosInstance.post('office/deleteAutBonusById', {
    deleteDocumentId: id,
  });

  return result;
};

const updateExcelSend = async (id) => {
  const result = await axiosInstance.patch('office/updateExcelSend', {
    DocumentId: id,
  });

  return result;
};

const checkAppraisalRecordError = async (excel_Name) => {
  const result = await axiosInstance.post('office/checkAppraisalRecordError', {
    excel_name: excel_Name,
  });

  return result;
};

const checkYearAppraisalRecordError = async (excel_Name) => {
  const result = await axiosInstance.post('office/checkYearAppraisalRecordError', {
    excel_name: excel_Name,
  });

  return result;
};

const mergeAppraisalExcel = async (excelArray) => {
  const result = await axiosInstance.post('office/mergeAppraisalExcel', {
    excelArray,
  });

  return result;
};

const mergeYearAppraisalExcel = async (excelArray) => {
  const result = await axiosInstance.post('office/mergeYearAppraisalExcel', {
    excelArray,
  });

  return result;
};


const mergeBonusExcel = async (excelArray) => {
  const result = await axiosInstance.post('office/mergeBonusExcel', {
    excelArray,
  });

  return result;
};

const mergeAutBonusExcel = async (excelArray) => {
  const result = await axiosInstance.post('office/mergeAutBonusExcel', {
    excelArray,
  });

  return result;
};

const getDropDownYear = async () => {
  const result = await axiosInstance.get('dropDown/getYear');
  return result;
};

const getDisableExcel = async () => {
  const result = await axiosInstance.get('dropDown/getDisableExcel');
  return result;
};

// 新建前即時確認 Server 端的考核開放狀態，避免舊分頁沿用過期狀態。
const getExcelTypeStatus = async (typeId) => {
  const result = await axiosInstance.get('office/getExcelTypeStatus', {
    params: { typeId },
  });

  return result;
};

// ======================================================
// 簽核流程 API
// ======================================================

// 送出前預覽簽核流程
const previewApprovalSubmit = async (data) => {
  const result = await axiosInstance.post('approval/preview-submit', data);
  return result;
};

// 建立者送出簽核
const submitApproval = async (data) => {
  const result = await axiosInstance.post('approval/submit', data);
  return result;
};

// 查詢簽核明細 / 歷史意見 / 流程
const fetchApprovalDetail = async (data) => {
  const result = await axiosInstance.post('approval/detail', data);
  return result;
};

// 簽核同意
const approveApproval = async (data) => {
  const result = await axiosInstance.post('approval/approve', data);
  return result;
};

// 簽核退回
const returnApproval = async (data) => {
  const result = await axiosInstance.post('approval/return', data);
  return result;
};

// 抽單
const withdrawApproval = async (data) => {
  const result = await axiosInstance.post('approval/withdraw', data);
  return result;
};

// ✅ 查詢 Excel 歷史版本
const getExcelFileVersions = async (data) => {
  const result = await axiosInstance.post('office/getExcelFileVersions', data);
  return result;
};

// ✅ 查詢單一 Excel 歷史版本
const getExcelFileVersionById = async (data) => {
  const result = await axiosInstance.post('office/getExcelFileVersionById', data);
  return result;
};

export {
  AppraisalAutExcelCallBack,
  AppraisalBonusExcelCallBack,
  AppraisalRecordExcelCallback,
  AppraisalYearRecordExcelCallback,

  EmployeeAppraisalExcelDirectory,
  EmployeeAutExcelDirectory,
  EmployeeBonusExcelDirectory,
  EmployeeYearAppraisalExcelDirectory,

  ExcelAddPassword,

  axiosLogin,

  checkAppraisalRecordError,
  checkYearAppraisalRecordError,

  createEmployeeAppraisalExcel,
  createEmployeeYearFinalAppraisalExcel,
  createExportAutExcel,
  createExportBonusExcel,

  deleteAutBonusById,
  deleteBonusById,
  deleteExcelById,
  deleteYearExcelById,

  documentUrl,

  getAppraisalTable,
  getBonusAutTable,
  getBonusExcelTable,
  getDisableExcel,
  getExcelTypeStatus,
  getDropDownYear,
  getExcelNameById,
  prepareLatestExcelDownload,
  getYearAppraisalTableFetch,

  mergeAppraisalExcel,
  mergeAutBonusExcel,
  mergeBonusExcel,
  mergeYearAppraisalExcel,

  mybaseUrl,
  onlyOfficeServer,
  serverPort,

  updateExcelSend,

  // 簽核流程 API
  previewApprovalSubmit,
  submitApproval,
  fetchApprovalDetail,
  approveApproval,
  returnApproval,
  withdrawApproval,
  // Excel 歷史版本 API
  getExcelFileVersions,
  getExcelFileVersionById,
};
