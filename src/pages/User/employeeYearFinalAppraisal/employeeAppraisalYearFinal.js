import TableConstants from '@/myModel/Constants/TableConstants';
import { ControlTableModel } from '@/myModel/ControlTableData/ControlTableData';
import { DisableExcelModel } from '@/myModel/DisableExcel/DisableExcel';
import { DropDownModel } from '@/myModel/DropDown/dropDown';
import { TableModel } from '@/myModel/TableData/Table';

import {
  checkYearAppraisalRecordError,
  mybaseUrl,

  // ✅ 簽核流程 API
  previewApprovalSubmit,
  submitApproval,
  fetchApprovalDetail,
  approveApproval,
  returnApproval,
  withdrawApproval,

  // ✅ Excel 歷史版本 API
  getExcelFileVersions,
  getExcelTypeStatus,
  prepareLatestExcelDownload,
} from '@/networkReuest/Myaxios';

import CheckYearApprasialModal from '@/pages/Modal/checkYearApprasialModal';
import DeleteYearApprasialModal from '@/pages/Modal/deleteYearApprasialModal';
import MyMergeYearDocumentModal from '@/pages/Modal/MyMergeYearDocumentModal';
import ResizeableTitle from '@/pages/publicComponents/ResizeableTitle';

import ApprovalSignModal from '@/myModel/ApprovalSignModal/ApprovalSignModal';
import ApprovalRowPolicy from '@/publicMethod/ApprovalRowPolicy';

import { MyUtils } from '@/publicMethod/Utils';
import { ResponsiveConstants } from '@/responsiveConstants/responsiveConstants';

import { ProTable } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import {
  Button,
  FloatButton,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  message,
} from 'antd';
import { useForm } from 'antd/es/form/Form';

import moment from 'moment';
import { useEffect, useRef, useState } from 'react';

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import { useSnapshot } from 'valtio';
import ROUTENAME from '../../../../config/routesName';

const { TextArea } = Input;

const EmployeeAppraisalYearFinal = () => {
  const { initialState } = useModel('@@initialState');

  const AppraisalTableSnap = useSnapshot(TableModel);
  const dropDownSnap = useSnapshot(DropDownModel);
  const disableExcelSnap = useSnapshot(DisableExcelModel);

  const [ExcelData, setExcelData] = useState({});
  const [deleteModal, setDeleteModal] = useState(false);
  const [MergeDocumentModal, setMergeDocumentModal] = useState(false);

  const [checkApprasialModal, setCheckApprasialModal] = useState(false);
  const [checkExcelData, setCheckExcelData] = useState([]);

  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalMode, setApprovalMode] = useState('submit'); // submit / approve / readonly
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalInfo, setApprovalInfo] = useState(null);
  const [currentApprovalRow, setCurrentApprovalRow] = useState(null);

  const [historyVersions, setHistoryVersions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [form] = useForm();
  const MySwal = withReactContent(Swal);

  const [tableRowKey, setTableRowKey] = useState([]);
  const [checkData, setcheckData] = useState([]);

  const currentRows = AppraisalTableSnap.AppraisalYearTable?.data || [];
  const latestRowsRef = useRef(currentRows);
  const [displayRows, setDisplayRows] = useState(currentRows);
  const [tableLoading, setTableLoading] = useState(false);
  const [downloadingExcelId, setDownloadingExcelId] = useState(null);

  latestRowsRef.current = currentRows;

  const tableWrapRef = useRef(null);
  const [needHorizontalScroll, setNeedHorizontalScroll] = useState(false);

  const loginUser = initialState?.user || {};
  const loginUserId = loginUser?.USER_ID;

  const isExcelTypeDisabled = (typeId) => {
    const status = disableExcelSnap.disableExcel || {};
    if (status.isLoading || !Array.isArray(status.data) || status.data.length === 0) {
      return true;
    }

    const found = status.data.find((item) => Number(item.id) === Number(typeId));
    return Number(found?.disable) === 1;
  };

  useEffect(() => {
    const refreshExcelTypeStatus = () => {
      DisableExcelModel.setDisableExcel().catch(() => {});
    };

    refreshExcelTypeStatus();
    const timer = window.setInterval(refreshExcelTypeStatus, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const ensureExcelTypeIsOpen = async (typeId) => {
    try {
      const result = await getExcelTypeStatus(typeId);
      const excelType = result?.data?.message;

      if (result?.data?.success === 1 && !excelType?.isDisabled) {
        return true;
      }
    } catch (error) {
      // Server 拒絕時與未開放同樣處理，避免舊畫面再建立文件。
    }

    Modal.warning({
      title: '考核已結束',
      content: '此考核已結束或狀態已變更，請重新整理後再操作。',
      onOk: () => window.location.reload(),
    });
    return false;
  };

  const handleDownloadLatestExcel = async (row) => {
    const excelId = row?.excel_id;
    if (!excelId) {
      message.error('找不到 Excel 資料');
      return;
    }

    setDownloadingExcelId(excelId);
    try {
      const result = await prepareLatestExcelDownload(excelId);
      if (result?.data?.success !== 1) {
        message.error(result?.data?.message || '無法準備最新 Excel');
        return;
      }

      const { fileUrl, fileName } = result.data.message || {};
      if (!fileUrl || !fileName) {
        message.error('找不到下載檔案');
        return;
      }

      MyUtils.fileDownload(`${mybaseUrl}${fileUrl}`, fileName);
    } catch (error) {
      message.error(error?.response?.data?.message || '下載最新 Excel 失敗');
    } finally {
      setDownloadingExcelId(null);
    }
  };

  /**
   * ✅ 年度考核流程 key
   */
  const getFlowTypeKeyByRow = () => {
    return 'year_appraisal';
  };

  /**
   * ✅ 管理者 / 總幹事 / 秘書顯示批次勾選
   */
  const canShowRowSelection = (() => {
    const adminType = String(loginUser?.admin_type || '');
    const missName = String(loginUser?.MISS_NAME || '');

    return (
      adminType === '1' ||
      missName === '總幹事' ||
      missName.includes('秘書')
    );
  })();

  const onFinish = () => {};

  /**
   * ✅ 重新查詢年度考核列表
   */
  const safeReloadYearAppraisalTable = async (year) => {
    setTableLoading(true);
    setTableRowKey([]);
    setcheckData([]);

    try {
      await Promise.resolve(
        TableModel.setAppraisalYearTable({
          year,
          statusMode: 'all',
        }),
      );
    } finally {
      setTimeout(() => {
        setDisplayRows(latestRowsRef.current || []);
        setTableLoading(false);
      }, 300);
    }
  };

  const reloadYearAppraisalTable = () => {
    const year = DropDownModel.getSelectedYear('annual');

    safeReloadYearAppraisalTable(year);
  };

  /**
   * ✅ 檢核 Excel 空白
   */
  const checkExcel_Blank = async (excelName) => {
    const result = await checkYearAppraisalRecordError(excelName);
    const { success, message: resultMessage } = result.data;

    if (success === 1) {
      await setCheckExcelData(resultMessage);

      if (resultMessage?.blankArray?.length > 0) {
        await setCheckApprasialModal(true);
      } else {
        await MySwal.fire({
          target: document.getElementById('EmployeeAppraisalTable'),
          title: <h3>檢核無誤</h3>,
          confirmButtonText: '關閉',
        });
      }
    }
  };

  /**
   * ✅ 查詢 Excel 歷史文件版本
   */
  const fetchExcelHistoryVersions = async (excelId) => {
    if (!excelId) {
      setHistoryVersions([]);
      return;
    }

    try {
      setHistoryLoading(true);

      const result = await getExcelFileVersions({
        excelId,
      });

      const data = result?.data;

      if (data?.success === 1) {
        setHistoryVersions(data?.message || []);
      } else {
        setHistoryVersions([]);
        console.warn('查詢歷史文件失敗：', data?.message);
      }
    } catch (e) {
      console.error(e);
      setHistoryVersions([]);
      message.error('查詢歷史文件失敗');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!tableLoading) {
      setDisplayRows(currentRows);
      return;
    }

    if (currentRows.length > 0) {
      setDisplayRows(currentRows);
      setTableLoading(false);
    }
  }, [currentRows, tableLoading]);

  /**
   * ✅ 關閉簽核 Modal
   */
  const closeApprovalModal = () => {
    setApprovalModalOpen(false);
    setApprovalMode('submit');
    setApprovalInfo(null);
    setCurrentApprovalRow(null);

    setHistoryVersions([]);
    setHistoryLoading(false);
  };

  /**
   * ✅ 開啟送出簽核 Modal
   */
  const openSubmitApprovalModal = async (row) => {
    try {
      setApprovalLoading(true);
      setCurrentApprovalRow(row);
      setApprovalMode('submit');

      const result = await previewApprovalSubmit({
        businessTable: 'appraisal_excel',
        businessId: row?.excel_id,
        flowTypeKey: getFlowTypeKeyByRow(row),
      });

      const data = result?.data;

      if (data?.success !== 1) {
        message.error(data?.message || '取得簽核流程失敗');
        return;
      }

      setApprovalInfo(data?.message);

      await fetchExcelHistoryVersions(row?.excel_id);

      setApprovalModalOpen(true);
    } catch (e) {
      console.error(e);
      message.error('取得簽核流程失敗');
    } finally {
      setApprovalLoading(false);
    }
  };

  /**
   * ✅ 開啟查看流程 / 簽核處理 Modal
   */
  const openApprovalDetailModal = async (row, mode = 'readonly') => {
    try {
      setApprovalLoading(true);
      setCurrentApprovalRow(row);
      setApprovalMode(mode);

      const result = await fetchApprovalDetail({
        businessTable: 'appraisal_excel',
        businessId: row?.excel_id,
      });

      const data = result?.data;

      if (data?.success !== 1) {
        message.error(data?.message || '取得簽核資料失敗');
        return;
      }

      setApprovalInfo(data?.message);

      await fetchExcelHistoryVersions(row?.excel_id);

      setApprovalModalOpen(true);
    } catch (e) {
      console.error(e);
      message.error('取得簽核資料失敗');
    } finally {
      setApprovalLoading(false);
    }
  };

  /**
   * ✅ 送出簽核
   */
  const handleSubmitApproval = async ({ opinion }) => {
    try {
      setApprovalLoading(true);

      const result = await submitApproval({
        businessTable: 'appraisal_excel',
        businessId: currentApprovalRow?.excel_id,
        flowTypeKey: getFlowTypeKeyByRow(currentApprovalRow),
        opinion,
      });

      const data = result?.data;

      if (data?.success !== 1) {
        message.error(data?.message || '送出簽核失敗');
        return;
      }

      message.success(data?.message || '已送出簽核');

      closeApprovalModal();
      reloadYearAppraisalTable();
    } catch (e) {
      console.error(e);
      message.error('送出簽核失敗');
    } finally {
      setApprovalLoading(false);
    }
  };

  /**
   * ✅ 同意簽核
   */
  const handleApproveApproval = async ({ approvalId, opinion }) => {
    try {
      setApprovalLoading(true);

      const result = await approveApproval({
        approvalId,
        opinion,
      });

      const data = result?.data;

      if (data?.success !== 1) {
        message.error(data?.message || '簽核失敗');
        return;
      }

      message.success(data?.message || '已同意');

      closeApprovalModal();
      reloadYearAppraisalTable();
    } catch (e) {
      console.error(e);
      message.error('簽核失敗');
    } finally {
      setApprovalLoading(false);
    }
  };

  /**
   * ✅ 退回簽核
   */
  const handleReturnApproval = async ({ approvalId, opinion }) => {
    try {
      setApprovalLoading(true);

      const result = await returnApproval({
        approvalId,
        opinion,
      });

      const data = result?.data;

      if (data?.success !== 1) {
        message.error(data?.message || '退回失敗');
        return;
      }

      message.success(data?.message || '已退回');

      closeApprovalModal();
      reloadYearAppraisalTable();
    } catch (e) {
      console.error(e);
      message.error('退回失敗');
    } finally {
      setApprovalLoading(false);
    }
  };

  /**
   * ✅ 抽單
   */
  const handleWithdrawApproval = async ({ approvalId, opinion }) => {
    try {
      if (!approvalId) {
        message.warning('找不到簽核流程，無法抽單');
        return;
      }

      setApprovalLoading(true);

      const result = await withdrawApproval({
        approvalId,
        businessTable: 'appraisal_excel',
        businessId: currentApprovalRow?.excel_id,
        opinion,
      });

      const data = result?.data;

      if (data?.success !== 1) {
        message.error(data?.message || '抽單失敗');
        return;
      }

      message.success(data?.message || '已抽單');

      closeApprovalModal();
      reloadYearAppraisalTable();
    } catch (e) {
      console.error(e);
      message.error('抽單失敗');
    } finally {
      setApprovalLoading(false);
    }
  };

  /**
   * ✅ 是否可批次簽核
   */
  const canBatchSign = (row) => {
    return ApprovalRowPolicy.isCurrentApprover(row, loginUserId);
  };

  const batchSignRows = checkData.filter((row) => canBatchSign(row));

  const ownSubmitRows = checkData.filter((row) => {
    return (
      ApprovalRowPolicy.isApplicant(row, loginUserId) &&
      ApprovalRowPolicy.canSubmit(row)
    );
  });

  /**
   * ✅ 批次同意 / 批次退回
   */
  const openBatchSignModal = (actionType) => {
    const rows = batchSignRows;
    const isApprove = actionType === 'approve';

    if (rows.length === 0) {
      if (ownSubmitRows.length > 0) {
        message.warning(
          '你勾選的是自己的填報資料，目前不是待簽核資料，請在「流程」欄按「送出簽核」。',
        );
        return;
      }

      if (checkData.length > 0) {
        message.warning(
          '你勾選的資料目前不是你的簽核關卡，不能批次同意或退回。',
        );
        return;
      }

      message.warning('請先勾選目前可簽核的資料');
      return;
    }

    let opinionValue = isApprove ? '同意。' : '';

    Modal.confirm({
      title: isApprove ? '確認批次同意？' : '確認批次退回？',
      width: 520,
      content: (
        <div>
          <div style={{ marginBottom: 8 }}>
            已選取可簽核資料：{rows.length} 筆
          </div>

          {checkData.length !== rows.length && (
            <div
              style={{
                marginBottom: 8,
                color: '#fa8c16',
                fontSize: 13,
              }}
            >
              已選取 {checkData.length} 筆，其中 {rows.length}
              筆可批次簽核，其餘不是目前你的簽核關卡，將不處理。
            </div>
          )}

          <div
            style={{
              border: '1px solid #ddd',
              backgroundColor: '#fafafa',
              padding: 8,
              marginBottom: 12,
              maxHeight: 180,
              overflowY: 'auto',
              fontSize: 13,
            }}
          >
            {rows.map((row, index) => (
              <div key={row.excel_id || index} style={{ marginBottom: 4 }}>
                {index + 1}. {MyUtils.formatExcelDisplayName(row.excel_Name)}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 6 }}>
            {isApprove ? '批次同意意見：' : '批次退回原因：'}
          </div>

          <TextArea
            rows={4}
            defaultValue={opinionValue}
            placeholder={isApprove ? '請輸入同意意見。' : '請輸入退回原因。'}
            onChange={(e) => {
              opinionValue = e.target.value;
            }}
          />
        </div>
      ),
      okText: isApprove ? '確認同意' : '確認退回',
      cancelText: '取消',
      centered: true,
      okButtonProps: {
        danger: !isApprove,
      },
      async onOk() {
        const opinion = String(opinionValue || '').trim();

        if (!isApprove && !opinion) {
          message.warning('批次退回時，請輸入退回原因');
          return Promise.reject();
        }

        try {
          setApprovalLoading(true);

          let successCount = 0;
          let failCount = 0;

          for (const row of rows) {
            try {
              const result = isApprove
                ? await approveApproval({
                  approvalId: row.approval_id,
                  opinion: opinion || '同意。',
                })
                : await returnApproval({
                  approvalId: row.approval_id,
                  opinion,
                });

              const data = result?.data;

              if (data?.success === 1) {
                successCount += 1;
              } else {
                failCount += 1;
              }
            } catch (e) {
              console.error(e);
              failCount += 1;
            }
          }

          if (failCount > 0) {
            message.warning(
              `批次處理完成，成功 ${successCount} 筆，失敗 ${failCount} 筆`,
            );
          } else {
            message.success(
              isApprove
                ? `已批次同意 ${successCount} 筆`
                : `已批次退回 ${successCount} 筆`,
            );
          }

          setTableRowKey([]);
          setcheckData([]);
          reloadYearAppraisalTable();
        } finally {
          setApprovalLoading(false);
        }
      },
    });
  };

  /**
   * ✅ 流程欄按鈕
   */
  const renderApprovalActionButton = (item) => {
    const actionMode = ApprovalRowPolicy.getActionMode(item, loginUserId);

    if (actionMode === 'submit') {
      return (
        <Button
          type="primary"
          style={{ backgroundColor: '#1677ff' }}
          onClick={() => openSubmitApprovalModal(item)}
        >
          送出簽核
        </Button>
      );
    }

    if (actionMode === 'approve') {
      return (
        <Button
          type="primary"
          style={{ backgroundColor: '#fa8c16' }}
          onClick={() => openApprovalDetailModal(item, 'approve')}
        >
          簽核處理
        </Button>
      );
    }

    if (actionMode === 'approved') {
      return (
        <Button
          type="primary"
          style={{ backgroundColor: '#52c41a' }}
          onClick={() => openApprovalDetailModal(item, 'readonly')}
        >
          已完成
        </Button>
      );
    }

    if (actionMode === 'returned') {
      return (
        <Button danger onClick={() => openApprovalDetailModal(item, 'readonly')}>
          已退回
        </Button>
      );
    }

    if (actionMode === 'rejected') {
      return (
        <Button danger onClick={() => openApprovalDetailModal(item, 'readonly')}>
          已駁回
        </Button>
      );
    }

    if (actionMode === 'withdrawn') {
      return (
        <Button onClick={() => openApprovalDetailModal(item, 'readonly')}>
          已抽單
        </Button>
      );
    }

    return (
      <Button onClick={() => openApprovalDetailModal(item, 'readonly')}>
        查看流程
      </Button>
    );
  };

  const [columns, setColumns] = useState(
    [
      {
        title: '名稱',
        key: 'excel_Name',
        width: 280,
        render: (item) => {
          return (
            <div
              className="myTableCell"
              data-th="檔名:"
              style={{
                whiteSpace: 'normal',
                wordBreak: 'break-all',
                lineHeight: '22px',
              }}
            >
              {MyUtils.formatExcelDisplayName(item?.excel_Name)}
            </div>
          );
        },
      },
      {
        title: '創建者',
        key: 'create_user',
        width: 90,
        render: (item) => {
          return (
            <div
              className="myTableCell"
              data-th="創建者:"
              style={{ whiteSpace: 'nowrap' }}
            >
              {item?.USER_NAME}
            </div>
          );
        },
      },
      {
        title: '創建時間',
        key: 'create_time',
        width: 170,
        render: (item) => {
          return (
            <div
              className="myTableCell"
              data-th="創建時間:"
              style={{ whiteSpace: 'nowrap' }}
            >
              {moment(item?.create_time).format('YYYY-MM-DD HH:mm:ss')}
            </div>
          );
        },
      },
      {
        title: '狀態',
        key: 'status',
        width: 180,
        render: (item) => {
          const statusText = ApprovalRowPolicy.getStatusText(item);
          const color = ApprovalRowPolicy.getStatusColor(item);

          return (
            <div className="myTableCell" data-th="狀態:">
              <span
                style={{
                  color,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {statusText}
              </span>

              <a
                style={{ marginLeft: 8 }}
                onClick={() => checkExcel_Blank(item?.excel_Name)}
              >
                檢核
              </a>
            </div>
          );
        },
      },
      {
        title: '流程',
        key: 'Review',
        width: 130,
        render: (item) => {
          return (
            <div className="myTableCell" data-th="流程:">
              {renderApprovalActionButton(item)}
            </div>
          );
        },
      },
      {
        title: '操作',
        key: 'operation',
        width: 220,
        render: (item) => {
          const user = initialState?.user || {};
          const canDelete = ApprovalRowPolicy.canDelete(item, user);
          const canViewFile = ApprovalRowPolicy.canViewFile(item, loginUserId);

          let deleteButton = null;

          if (canDelete) {
            deleteButton = (
              <Button
                type="primary"
                style={{ backgroundColor: 'red' }}
                onClick={async () => {
                  await setExcelData({ excelId: item?.excel_id });
                  await setDeleteModal(true);
                }}
              >
                刪除
              </Button>
            );
          }

          if (!canViewFile) {
            return (
              <div
                className="myTableCell"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  color: '#999',
                }}
                data-th="操作:"
              />
            );
          }

          return (
            <div
              className="myTableCell"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 8,
                flexWrap: 'nowrap',
                whiteSpace: 'nowrap',
              }}
              data-th="操作:"
            >
              {deleteButton}

              <Button
                type="primary"
                loading={downloadingExcelId === item?.excel_id}
                onClick={() => handleDownloadLatestExcel(item)}
              >
                下載
              </Button>

              <Button
                type="primary"
                style={{ backgroundColor: '#389e0d' }}
                onClick={() => {
                  window.open(
                    `${ROUTENAME.PreviewYearAppraisalRecordExcel}?DocumentId=${item?.excel_id}`,
                    '_blank',
                  );
                }}
              >
                預覽
              </Button>
            </div>
          );
        },
      },
    ].filter((item) => {
      const { admin_type } = initialState?.user || {};

      if (admin_type === '1') {
        return true;
      }

      return item.title !== '創建者' && item.title !== '狀態';
    }),
  );

  const components = {
    header: {
      cell: ResizeableTitle,
    },
  };

  const handleResize =
    (index) =>
      (e, { size }) => {
        const newColumns = [...columns];

        newColumns[index] = {
          ...newColumns[index],
          width: size.width,
        };

        setColumns(newColumns);
      };

  const mergeColumns = columns.map((col, index) => ({
    ...col,
    onHeaderCell: (column) => ({
      width: column.width,
      onResize: handleResize(index),
    }),
  }));

  /**
   * ✅ 判斷是否需要水平捲軸
   */
  useEffect(() => {
    const calcNeedScroll = () => {
      const tableWrap = tableWrapRef.current;

      if (!tableWrap) return;

      const rowSelectionWidth = canShowRowSelection ? 48 : 0;

      const totalColumnWidth = columns.reduce((total, col) => {
        return total + Number(col.width || 120);
      }, rowSelectionWidth);

      const containerWidth = tableWrap.clientWidth;

      setNeedHorizontalScroll(totalColumnWidth > containerWidth + 5);
    };

    calcNeedScroll();

    let resizeObserver = null;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        calcNeedScroll();
      });

      if (tableWrapRef.current) {
        resizeObserver.observe(tableWrapRef.current);
      }
    }

    window.addEventListener('resize', calcNeedScroll);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      window.removeEventListener('resize', calcNeedScroll);
    };
  }, [columns, canShowRowSelection]);

  const rowSelection = {
    selectedRowKeys: tableRowKey,

    onChange: (selectedRowKeys, selectedRows) => {
      setTableRowKey(selectedRowKeys);
      setcheckData(selectedRows);
    },

    onSelect: () => {},

    onSelectAll: () => {},

    getCheckboxProps: () => {
      return {
        disabled: false,
      };
    },
  };

  const canWithdrawCurrentRow = ApprovalRowPolicy.canWithdraw(
    currentApprovalRow,
    loginUserId,
  );

  return (
    <div className="EditTableStyle">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          width: '100%',
          position: 'relative',
          marginBottom: '16px',
        }}
      >
        <div style={{ flex: 1, minWidth: '280px' }}>
          <Form form={form} name="radio-form" onFinish={onFinish}>
            <Form.Item
              name="options"
              label=""
              initialValue={TableConstants.employeeAppraisalYearFinal}
            >
              <Radio.Group>
                <Radio
                  value={TableConstants.employeeAppraisalUsually}
                  onChange={() => {
                    ControlTableModel.setAppraisalTableType(
                      TableConstants.employeeAppraisalUsually,
                    );
                  }}
                >
                  平時考核
                </Radio>

                <Radio
                  value={TableConstants.employeeAppraisalYearFinal}
                  onChange={() => {
                    ControlTableModel.setAppraisalTableType(
                      TableConstants.employeeAppraisalYearFinal,
                    );
                  }}
                >
                  年度考核
                </Radio>

                <Radio
                  value={TableConstants.employeeBonusSurvey}
                  onChange={() => {
                    ControlTableModel.setAppraisalTableType(
                      TableConstants.employeeBonusSurvey,
                    );
                  }}
                >
                  獎金調查
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Form>
        </div>

        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        >
          <h2 style={{ margin: 0, color: 'purple',fontSize:24 }}>員工年度考核紀錄</h2>
        </div>

        <div style={{ minWidth: '180px', textAlign: 'right' }}>
          {(initialState?.user?.admin_type === '0' ||
            initialState?.user?.MISS_NAME === '總幹事') && (
            <Button
              type="primary"
              disabled={isExcelTypeDisabled(2)}
              style={
                isExcelTypeDisabled(2)
                  ? {
                    backgroundColor: '#e0e0e0',
                    color: '#666',
                    borderColor: '#e0e0e0',
                    cursor: 'not-allowed',
                  }
                  : {
                    backgroundColor: '#389e0d',
                    borderColor: '#389e0d',
                  }
              }
              onClick={async () => {
                if (isExcelTypeDisabled(2)) return;
                if (!(await ensureExcelTypeIsOpen(2))) return;

                const handleMessage = (event) => {
                  if (event.origin !== window.location.origin) return;

                  const data = event.data;

                  if (data?.type !== 'YEAR_APPRAISAL_EXCEL_CREATED') return;

                  const currentYear = DropDownModel.getSelectedYear('annual');

                  safeReloadYearAppraisalTable(currentYear);

                  console.log('收到年度考核 Excel 建立完成通知，重新查詢列表：', {
                    currentYear,
                    excelName: data?.excelName,
                    excelId: data?.excelId,
                  });

                  window.removeEventListener('message', handleMessage);
                };

                window.addEventListener('message', handleMessage);

                const newWindow = window.open(
                  ROUTENAME.CreateYearAppraisalRecordExcel,
                  '_blank',
                );

                if (!newWindow) {
                  window.removeEventListener('message', handleMessage);

                  Modal.warning({
                    title: '無法開啟新視窗',
                    content:
                      '瀏覽器可能阻擋了彈出視窗，請允許彈出視窗後再試一次。',
                  });
                }
              }}
            >
              {isExcelTypeDisabled(2)
                ? '年度考核表未開放'
                : '新建考核表'}
            </Button>
          )}
        </div>
      </div>

      <div className="tableMargin" style={{ border: 'solid 1px purple' }} />

      <div
        ref={tableWrapRef}
        style={{
          width: '100%',
          overflowX: needHorizontalScroll ? 'auto' : 'hidden',
          overflowY: 'hidden',
        }}
      >
        <ProTable
          id="EmployeeAppraisalTable"
          headerTitle={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <span style={{ fontSize: '16px' }}>年度:</span>

              <Select
                notFoundContent={<div />}
                style={{ width: 100 }}
                placeholder=""
                options={dropDownSnap.dropDownYear.data}
                value={dropDownSnap.getSelectedYear('annual')}
                onChange={(value) => {
                  setTableRowKey([]);
                  setcheckData([]);

                  DropDownModel.setSelectedYear('annual', value);

                  safeReloadYearAppraisalTable(value);
                }}
              />

              {canShowRowSelection && (
                <>
                  <Button
                    type="primary"
                    size="small"
                    disabled={approvalLoading}
                    loading={approvalLoading}
                    onClick={() => openBatchSignModal('approve')}
                  >
                    批次同意
                  </Button>

                  <Button
                    size="small"
                    danger
                    disabled={approvalLoading}
                    loading={approvalLoading}
                    onClick={() => openBatchSignModal('return')}
                  >
                    批次退回
                  </Button>

                  {batchSignRows.length > 0 && (
                    <span style={{ color: '#666', fontSize: 13 }}>
                      可批次簽核：{batchSignRows.length} 筆
                    </span>
                  )}

                  {checkData.length > 0 && (
                    <span style={{ color: '#1677ff', fontSize: 13 }}>
                      已選取：{checkData.length} 筆
                    </span>
                  )}
                </>
              )}
            </div>
          }
          rowSelection={canShowRowSelection ? rowSelection : undefined}
          rowKey={(record) => record.excel_id}
          columnsState={{
            defaultValue: {},
          }}
          pagination={
            window.innerWidth <= ResponsiveConstants.cellphoneSize
              ? false
              : {
                defaultPageSize: 50,
                showSizeChanger: true,
                pageSizeOptions: ['5', '10', '20', '30', '40', '50', '100'],
                locale: { items_per_page: '/筆' },
                showTotal: (total, range) => (
                  <span>
                      第{range[0]}-{range[1]}筆 / 總共{total}筆
                    </span>
                ),
              }
          }
          options={{
            reload: () => {
              reloadYearAppraisalTable();
            },
            density: false,
            fullScreen: true,
          }}
          tooltip={false}
          search={false}
          locale={{ emptyText: tableLoading ? '資料載入中...' : '無資料' }}
          loading={tableLoading}
          scroll={needHorizontalScroll ? { x: 'max-content' } : undefined}
          components={components}
          columns={mergeColumns}
          dataSource={displayRows}
        />
      </div>

      {canShowRowSelection && checkData.length > 0 && (
        <FloatButton
          badge={{
            count: checkData.length,
            color: 'blue',
          }}
          onClick={async () => {
            await setMergeDocumentModal(true);
          }}
        />
      )}

      {/* ✅ 合併文件 Modal */}
      <Modal
        title=""
        getContainer={() =>
          MyUtils.isFullscreenElement()
            ? document.getElementById('EmployeeAppraisalTable')
            : document.getElementById('root')
        }
        afterOpenChange={(op) => {
          document.body.style.overflowY = op ? 'hidden' : 'scroll';
        }}
        open={MergeDocumentModal}
        centered
        footer={null}
        onOk={() => setMergeDocumentModal(false)}
        onCancel={() => setMergeDocumentModal(false)}
        width={600}
        destroyOnClose
      >
        <MyMergeYearDocumentModal
          setMergeDocumentModal={setMergeDocumentModal}
          setcheckData={setcheckData}
          setTableRowKey={setTableRowKey}
          checkData={checkData}
        />
      </Modal>

      {/* ✅ 檢核結果 Modal */}
      <Modal
        style={{ top: 20 }}
        title=""
        getContainer={() =>
          MyUtils.isFullscreenElement()
            ? document.getElementById('EmployeeAppraisalTable')
            : document.getElementById('root')
        }
        afterOpenChange={(op) => {
          document.body.style.overflowY = op ? 'hidden' : 'scroll';
        }}
        open={checkApprasialModal}
        footer={null}
        onOk={() => setCheckApprasialModal(false)}
        onCancel={() => setCheckApprasialModal(false)}
        width={600}
        destroyOnClose
      >
        <CheckYearApprasialModal
          checkExcelData={checkExcelData}
          setCheckApprasialModal={setCheckApprasialModal}
        />
      </Modal>

      {/* ✅ 刪除 Modal */}
      <Modal
        title=""
        getContainer={() =>
          MyUtils.isFullscreenElement()
            ? document.getElementById('EmployeeAppraisalTable')
            : document.getElementById('root')
        }
        afterOpenChange={(op) => {
          document.body.style.overflowY = op ? 'hidden' : 'scroll';
        }}
        open={deleteModal}
        footer={null}
        centered
        onOk={() => setDeleteModal(false)}
        onCancel={() => setDeleteModal(false)}
        width={350}
        destroyOnClose
      >
        <DeleteYearApprasialModal
          deleteExcelData={ExcelData}
          setDeleteModal={setDeleteModal}
        />
      </Modal>

      {/* ✅ 簽核 Modal */}
      <ApprovalSignModal
        open={approvalModalOpen}
        mode={approvalMode}
        loading={approvalLoading}
        approvalInfo={approvalInfo}
        canWithdraw={canWithdrawCurrentRow}
        historyVersions={historyVersions}
        historyLoading={historyLoading}
        fileBaseUrl={mybaseUrl}
        onCancel={closeApprovalModal}
        onSubmitApproval={handleSubmitApproval}
        onApprove={handleApproveApproval}
        onReturn={handleReturnApproval}
        onWithdraw={handleWithdrawApproval}
        onDownloadHistory={(version) => {
          if (!version?.version_file_path) {
            message.warning('找不到歷史文件路徑');
            return;
          }

          const fileUrl = `${mybaseUrl}/${String(
            version.version_file_path,
          ).replace(/^\/+/, '')}`;

          MyUtils.fileDownload(
            fileUrl,
            version.version_file_name || '歷史文件.xlsx',
          );
        }}
        onPreviewHistory={(version) => {
          if (!version?.id) {
            message.warning('找不到歷史文件版本 ID');
            return;
          }

          const query = new URLSearchParams({
            DocumentId: currentApprovalRow?.excel_id || version?.excel_id || '',
            history: '1',
            readonly: '1',
            historyVersionId: String(version.id),
          });

          window.open(
            `${ROUTENAME.PreviewYearAppraisalRecordExcel}?${query.toString()}`,
            '_blank',
          );
        }}
      />
    </div>
  );
};

export default EmployeeAppraisalYearFinal;
