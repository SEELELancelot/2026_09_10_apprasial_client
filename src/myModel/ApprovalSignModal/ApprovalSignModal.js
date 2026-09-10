import { Modal, Button, Input, message, Tabs, Popover } from 'antd';
import { useEffect, useMemo, useState } from 'react';

const { TextArea } = Input;


const statusTextMap = {
  draft: '待送出',
  pending: '待簽核',
  waiting: '未抵達',
  approved: '已同意',
  returned: '已退回',
  rejected: '已駁回',
  withdrawn: '已抽單',
  cancel: '已取消',
};


const actionTextMap = {
  submit: '送出',
  approve: '同意',
  return: '退回',
  reject: '駁回',
  withdraw: '抽單',
  cancel: '取消',
};

const versionTypeTextMap = {
  initial_draft: '初始草稿',
  edit_snapshot: '修改版本',
  submit_snapshot: '送出版本',
  approve_snapshot: '簽核版本',
  return_snapshot: '退回版本',
  return_edit_snapshot: '退回後修改版本',
  final_snapshot: '完成版本',
  before_edit_snapshot: '修改前版本',
  after_edit_snapshot: '修改後版本',
};

/**
 * ✅ 歷史版本類型轉中文
 */
const getVersionTypeText = (versionType) => {
  const type = String(versionType || '');

  return versionTypeTextMap[type] || type || '-';
};

/**
 * ✅ 不同操作對應不同預設意見
 */
const opinionPresetMap = {
  submit: ['資料確認無誤。', '填報資料，已確認無誤。'],

  approve: ['同意。', '已審核，同意。'],

  return: ['請修正後重新送出。', '請重新確認內容後再送出。'],

  withdraw: ['資料需修正。'],
};

const ApprovalSignModal = ({
                             open,
                             mode = 'submit', // submit / approve / readonly
                             loading = false,
                             approvalInfo = {},
                             canWithdraw = false,

                             /**
                              * ✅ 歷史文件版本
                              *
                              * 後端 getExcelFileVersions 回傳的 message 直接丟進來。
                              */
                             historyVersions = [],
                             historyLoading = false,

                             /**
                              * ✅ 歷史文件下載 / 預覽
                              *
                              * 建議父層傳入：
                              * onDownloadHistory(version)
                              * onPreviewHistory(version)
                              */
                             onDownloadHistory,
                             onPreviewHistory,

                             /**
                              * ✅ 如果沒傳 onDownloadHistory / onPreviewHistory，
                              * 可以傳 fileBaseUrl，例如 mybaseUrl。
                              */
                             fileBaseUrl = '',

                             onCancel,
                             onSubmitApproval,
                             onApprove,
                             onReturn,
                             onWithdraw,
                           }) => {
  const [opinion, setOpinion] = useState('');
  const [withdrawOpinion, setWithdrawOpinion] = useState('');
  const [opinionPopoverOpen, setOpinionPopoverOpen] = useState(false);
  const [withdrawPopoverOpen, setWithdrawPopoverOpen] = useState(false);

  /**
   * ✅ 目前開啟中的 TAB
   *
   * sign：顯示底部送出 / 同意 / 退回
   * flow：只顯示關閉
   * withdraw：抽單按鈕在 TAB 內容裡
   * history：歷史文件，下載 / 預覽
   */
  const [activeTabKey, setActiveTabKey] = useState('sign');

  const isSubmitMode = mode === 'submit';
  const isApproveMode = mode === 'approve';
  const isReadonlyMode = mode === 'readonly';

  const {
    documentTitle,
    applicant,
    instance,
    currentStep,
    nextStep,
    steps = [],
    logs = [],
  } = approvalInfo || {};

  /**
   * ✅ 修正抽單後，再點「送出簽核」時內容空白的問題
   */
  useEffect(() => {
    if (!open) return;

    setOpinion('');
    setWithdrawOpinion('');
    setOpinionPopoverOpen(false);
    setWithdrawPopoverOpen(false);
    setActiveTabKey('sign');
  }, [open, mode, instance?.approval_id]);

  const modalTitle = useMemo(() => {
    if (isSubmitMode) return '送出簽核';
    if (isApproveMode) return '簽核意見';
    return '查看簽核流程';
  }, [isSubmitMode, isApproveMode]);

  const opinionTitle = useMemo(() => {
    if (isSubmitMode) return '送出意見';
    if (isApproveMode) return '簽核意見';
    return '簽核意見';
  }, [isSubmitMode, isApproveMode]);

  const opinionMenuTypeList = useMemo(() => {
    if (isSubmitMode) {
      return [
        {
          type: 'submit',
          title: '常用意見',
        },
      ];
    }

    if (isApproveMode) {
      return [
        {
          type: 'approve',
          title: '同意常用意見',
        },
        {
          type: 'return',
          title: '退回常用意見',
        },
      ];
    }

    return [];
  }, [isSubmitMode, isApproveMode]);

  const handleClose = () => {
    setOpinion('');
    setWithdrawOpinion('');
    setOpinionPopoverOpen(false);
    setWithdrawPopoverOpen(false);
    setActiveTabKey('sign');
    onCancel?.();
  };

  /**
   * ✅ 歷史檔案 URL
   */
  const getHistoryFileUrl = (version) => {
    const versionFilePath = String(version?.version_file_path || '').replace(
      /^\/+/,
      '',
    );

    if (!versionFilePath) return '';

    if (!fileBaseUrl) {
      return `/${versionFilePath}`;
    }

    return `${String(fileBaseUrl).replace(/\/+$/, '')}/${versionFilePath}`;
  };

  /**
   * ✅ 下載歷史文件
   */
  const handleDownloadHistory = (version) => {
    if (onDownloadHistory) {
      onDownloadHistory(version);
      return;
    }

    const url = getHistoryFileUrl(version);

    if (!url) {
      message.warning('找不到歷史文件路徑');
      return;
    }

    window.open(url, '_blank');
  };

  /**
   * ✅ 預覽歷史文件
   */
  const handlePreviewHistory = (version) => {
    if (onPreviewHistory) {
      onPreviewHistory(version);
      return;
    }

    const url = getHistoryFileUrl(version);

    if (!url) {
      message.warning('找不到歷史文件路徑');
      return;
    }

    window.open(url, '_blank');
  };

  /**
   * ✅ 真正送出簽核
   */
  const doSubmitApproval = async () => {
    await onSubmitApproval?.({
      opinion,
    });

    setOpinion('');
    setOpinionPopoverOpen(false);
  };

  /**
   * ✅ 真正同意
   */
  const doApproveApproval = async () => {
    await onApprove?.({
      approvalId: instance?.approval_id,
      opinion,
    });

    setOpinion('');
    setOpinionPopoverOpen(false);
  };

  /**
   * ✅ 真正退回
   */
  const doReturnApproval = async () => {
    await onReturn?.({
      approvalId: instance?.approval_id,
      opinion,
    });

    setOpinion('');
    setOpinionPopoverOpen(false);
  };

  /**
   * ✅ 真正抽單
   */
  const doWithdrawApproval = async () => {
    await onWithdraw?.({
      approvalId: instance?.approval_id,
      opinion: withdrawOpinion,
    });

    setWithdrawOpinion('');
    setWithdrawPopoverOpen(false);
  };

  /**
   * ✅ 送出前確認
   */
  const handleSubmit = async () => {
    if (!opinion.trim()) {
      message.warning('請輸入送出意見');
      return;
    }

    Modal.confirm({
      title: '確認送出簽核？',
      content: (
        <div>
          <div className="mb-2 text-gray-700">
            送出後將進入簽核流程，確定要送出嗎？
          </div>

          <div className="rounded border bg-gray-50 p-2 text-sm text-gray-700">
            <div className="mb-1 font-semibold">送出意見：</div>
            <div className="whitespace-pre-wrap">{opinion}</div>
          </div>
        </div>
      ),
      okText: '確定送出',
      cancelText: '取消',
      centered: true,
      onOk: doSubmitApproval,
    });
  };

  /**
   * ✅ 同意前確認
   */
  const handleApprove = async () => {
    Modal.confirm({
      title: '確認同意簽核？',
      content: (
        <div>
          <div className="mb-2 text-gray-700">
            確定要同意此筆簽核資料嗎？
          </div>

          <div className="rounded border bg-gray-50 p-2 text-sm text-gray-700">
            <div className="mb-1 font-semibold">簽核意見：</div>
            <div className="whitespace-pre-wrap">
              {opinion?.trim() || '無意見'}
            </div>
          </div>
        </div>
      ),
      okText: '確定同意',
      cancelText: '取消',
      centered: true,
      onOk: doApproveApproval,
    });
  };

  /**
   * ✅ 退回前確認
   */
  const handleReturn = async () => {
    if (!opinion.trim()) {
      message.warning('退回時請填寫退回原因');
      return;
    }

    Modal.confirm({
      title: '確認退回簽核？',
      content: (
        <div>
          <div className="mb-2 text-gray-700">
            退回後填報者需修正後重新送出，確定要退回嗎？
          </div>

          <div className="rounded border bg-gray-50 p-2 text-sm text-gray-700">
            <div className="mb-1 font-semibold">退回原因：</div>
            <div className="whitespace-pre-wrap">{opinion}</div>
          </div>
        </div>
      ),
      okText: '確定退回',
      cancelText: '取消',
      okButtonProps: {
        danger: true,
      },
      centered: true,
      onOk: doReturnApproval,
    });
  };

  /**
   * ✅ 抽單前確認
   *
   * 抽單原因必填。
   */
  const handleWithdraw = async () => {
    if (!withdrawOpinion.trim()) {
      message.warning('抽單時請填寫抽單原因');
      return;
    }

    Modal.confirm({
      title: '確認抽單？',
      content: (
        <div>
          <div className="mb-2 text-gray-700">
            抽單後，此文件會回到可重新送出的狀態，原簽核流程將作廢。
          </div>

          <div className="mb-2 rounded border bg-gray-50 p-2 text-sm text-gray-700">
            <div>
              <span className="font-semibold">文件名稱：</span>
              {documentTitle || '-'}
            </div>

            <div>
              <span className="font-semibold">填報者：</span>
              {applicant?.USER_NAME || '-'} / {applicant?.MISS_NAME || '-'}
            </div>

            <div>
              <span className="font-semibold">填報單位：</span>
              {applicant?.BRANCH_NAME || '-'}
            </div>
          </div>

          <div className="rounded border bg-gray-50 p-2 text-sm text-gray-700">
            <div className="mb-1 font-semibold">抽單原因：</div>
            <div className="whitespace-pre-wrap">{withdrawOpinion}</div>
          </div>
        </div>
      ),
      okText: '確認抽單',
      cancelText: '取消',
      centered: true,
      okButtonProps: {
        danger: true,
      },
      onOk: doWithdrawApproval,
    });
  };

  const renderOpinionPopoverContent = () => {
    if (opinionMenuTypeList.length === 0) {
      return null;
    }

    const isTwoColumn = opinionMenuTypeList.length >= 2;

    return (
      <div
        className={[
          'grid gap-4',
          isTwoColumn ? 'grid-cols-2' : 'grid-cols-1',
        ].join(' ')}
        style={{
          minWidth: isTwoColumn ? 520 : 240,
          maxWidth: isTwoColumn ? 680 : 320,
        }}
      >
        {opinionMenuTypeList.map((group) => (
          <div key={group.type} className="min-w-[230px]">
            <div className="mb-2 border-b pb-1 text-sm font-semibold text-gray-600">
              {group.title}
            </div>

            <div className="flex flex-col gap-1">
              {(opinionPresetMap[group.type] || []).map((text, index) => (
                <button
                  key={`${group.type}-${index}`}
                  type="button"
                  className="rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => {
                    setOpinion(text);
                    setOpinionPopoverOpen(false);
                  }}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderWithdrawPopoverContent = () => {
    return (
      <div style={{ minWidth: 260 }}>
        <div className="mb-2 border-b pb-1 text-sm font-semibold text-gray-600">
          抽單常用原因
        </div>

        <div className="flex flex-col gap-1">
          {(opinionPresetMap.withdraw || []).map((text, index) => (
            <button
              key={`withdraw-${index}`}
              type="button"
              className="rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
              onClick={() => {
                setWithdrawOpinion(text);
                setWithdrawPopoverOpen(false);
              }}
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderHistoryTab = () => {
    return (
      <div className="p-4">
        <div className="mb-3 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          <div className="mb-1 font-bold">歷史文件說明</div>

          <div className="leading-6">
            顯示各簽核階段保留下來的文件修改版本。
            同一位填報者或簽核者在同一關卡多次修改時，只保留該階段最新修改後文件。
          </div>

          <div className="mt-2 leading-6">
            <span className="font-bold">建立時間：</span>
            表示此階段第一次產生歷史版本的時間。
          </div>

          <div className="leading-6">
            <span className="font-bold">更新時間：</span>
            表示同一階段再次修改並覆蓋該歷史版本的最後時間。
          </div>
        </div>

        <div className="overflow-x-auto rounded border border-gray-300">
          <table className="min-w-[980px] w-full border-collapse text-sm">
            <thead>
            <tr className="bg-gray-600 text-white">
              <th className="w-[70px] border border-gray-300 px-2 py-2 text-left">
                版本
              </th>
              <th className="w-[130px] border border-gray-300 px-2 py-2 text-left">
                類型
              </th>
              <th className="w-[130px] border border-gray-300 px-2 py-2 text-left">
                修改者
              </th>
              <th className="w-[130px] border border-gray-300 px-2 py-2 text-left">
                職稱
              </th>
              <th className="w-[150px] border border-gray-300 px-2 py-2 text-left">
                單位
              </th>
              <th className="border border-gray-300 px-2 py-2 text-left">
                歷史檔名
              </th>
              <th className="w-[150px] border border-gray-300 px-2 py-2 text-left">
                建立時間
              </th>
              <th className="w-[150px] border border-gray-300 px-2 py-2 text-left">
                更新時間
              </th>
              <th className="w-[150px] border border-gray-300 px-2 py-2 text-left">
                操作
              </th>
            </tr>
            </thead>

            <tbody>
            {historyLoading ? (
              <tr>
                <td
                  colSpan={9}
                  className="border border-gray-300 px-3 py-8 text-center text-gray-400"
                >
                  歷史文件載入中...
                </td>
              </tr>
            ) : historyVersions.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="border border-gray-300 px-3 py-8 text-center text-gray-400"
                >
                  尚無歷史文件紀錄。
                </td>
              </tr>
            ) : (
              historyVersions.map((version, index) => (
                <tr
                  key={version.id || `${version.version_no}-${index}`}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="border border-gray-300 px-2 py-2 font-semibold text-blue-700">
                    V
                    {String(version.version_no || index + 1).padStart(
                      3,
                      '0',
                    )}
                  </td>

                  <td className="border border-gray-300 px-2 py-2">
                    {getVersionTypeText(version.version_type)}
                  </td>

                  <td className="border border-gray-300 px-2 py-2">
                    {version.editor_user_name || '-'}
                  </td>

                  <td className="border border-gray-300 px-2 py-2">
                    {version.editor_miss_name || '-'}
                  </td>

                  <td className="border border-gray-300 px-2 py-2">
                    {version.editor_branch_name || '-'}
                  </td>

                  <td className="border border-gray-300 px-2 py-2">
                    <div
                      className="max-w-[280px] truncate"
                      title={version.version_file_name || '-'}
                    >
                      {version.version_file_name || '-'}
                    </div>
                  </td>

                  <td className="border border-gray-300 px-2 py-2">
                    {version.created_at || '-'}
                  </td>

                  <td className="border border-gray-300 px-2 py-2">
                    {version.updated_at || '-'}
                  </td>

                  <td className="border border-gray-300 px-2 py-2">
                    <div className="flex gap-2">
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => handleDownloadHistory(version)}
                      >
                        下載
                      </Button>

                      <Button
                        type="primary"
                        size="small"
                        style={{ backgroundColor: '#389e0d' }}
                        onClick={() => handlePreviewHistory(version)}
                      >
                        預覽
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const tabItems = [
    {
      key: 'sign',
      label: '簽核意見',
      children: (
        <div className="p-4">
          <div className="mb-4 grid grid-cols-1 items-stretch gap-3 md:grid-cols-[1fr_auto_1fr]">
            <StepBox
              title={isSubmitMode ? '目前位置' : '目前關卡'}
              step={currentStep}
              emptyText="無關卡"
            />

            <div className="flex items-center justify-center text-2xl font-bold text-gray-500">
              →
            </div>

            <StepBox
              title={isSubmitMode ? '第一關卡' : '下一關卡'}
              step={nextStep}
              emptyText="無下一關"
            />
          </div>

          <div className="overflow-hidden rounded border border-gray-300">
            <table className="w-full border-collapse text-sm">
              <thead>
              <tr className="bg-gray-600 text-white">
                <th className="w-[60px] border border-gray-300 px-2 py-2 text-left">
                  序
                </th>
                <th className="w-[120px] border border-gray-300 px-2 py-2 text-left">
                  單位
                </th>
                <th className="w-[110px] border border-gray-300 px-2 py-2 text-left">
                  職稱
                </th>
                <th className="w-[110px] border border-gray-300 px-2 py-2 text-left">
                  姓名
                </th>
                <th className="border border-gray-300 px-2 py-2 text-left">
                  意見
                </th>
                <th className="w-[150px] border border-gray-300 px-2 py-2 text-left">
                  簽章時間
                </th>
                <th className="w-[80px] border border-gray-300 px-2 py-2 text-left">
                  動作
                </th>
              </tr>
              </thead>

              <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="border border-gray-300 px-3 py-8 text-center text-gray-400"
                  >
                    尚無簽核意見
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr
                    key={log.log_id || index}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="border border-gray-300 px-2 py-2 text-red-600">
                      {index + 1}
                    </td>

                    <td className="border border-gray-300 px-2 py-2 text-red-600">
                      {log.action_branch_name || '-'}
                    </td>

                    <td className="border border-gray-300 px-2 py-2 text-red-600">
                      {log.action_miss_name || '-'}
                    </td>

                    <td className="border border-gray-300 px-2 py-2 text-red-600">
                      {log.action_user_name || '-'}
                    </td>

                    <td className="border border-gray-300 px-2 py-2 text-red-600">
                      {log.opinion || '無意見'}
                    </td>

                    <td className="border border-gray-300 px-2 py-2 text-red-600">
                      {log.action_time || '-'}
                    </td>

                    <td className="border border-gray-300 px-2 py-2 text-red-600">
                      {actionTextMap[log.action_type] ||
                        log.action_type ||
                        '-'}
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>

          {!isReadonlyMode && (
            <div className="mt-4 rounded border border-gray-300 bg-gray-50">
              <div className="flex items-center justify-between border-b border-gray-300 px-3 py-2 font-semibold text-gray-700">
                <Popover
                  content={renderOpinionPopoverContent()}
                  trigger="hover"
                  placement="bottomLeft"
                  open={opinionPopoverOpen}
                  onOpenChange={setOpinionPopoverOpen}
                >
                  <button
                    type="button"
                    className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-gray-700 hover:text-blue-600"
                  >
                    {opinionTitle}
                    <span className="ml-1 text-xs text-gray-500">▼</span>
                  </button>
                </Popover>

                <span className="text-xs font-normal text-gray-400" />
              </div>

              <div className="p-3">
                <TextArea
                  rows={5}
                  value={opinion}
                  onChange={(e) => setOpinion(e.target.value)}
                  placeholder={
                    isSubmitMode
                      ? '請輸入送出意見。'
                      : '請輸入簽核意見。'
                  }
                />
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'flow',
      label: '流程',
      children: (
        <div className="p-4">
          <div className="overflow-hidden rounded border border-gray-300">
            <table className="w-full border-collapse text-sm">
              <thead>
              <tr className="bg-gray-600 text-white">
                <th className="w-[70px] border border-gray-300 px-2 py-2 text-left">
                  關卡
                </th>
                <th className="border border-gray-300 px-2 py-2 text-left">
                  關卡名稱
                </th>
                <th className="w-[130px] border border-gray-300 px-2 py-2 text-left">
                  簽核者
                </th>
                <th className="w-[130px] border border-gray-300 px-2 py-2 text-left">
                  職稱
                </th>
                <th className="w-[150px] border border-gray-300 px-2 py-2 text-left">
                  單位
                </th>
                <th className="w-[100px] border border-gray-300 px-2 py-2 text-left">
                  狀態
                </th>
              </tr>
              </thead>

              <tbody>
              {steps.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="border border-gray-300 px-3 py-8 text-center text-gray-400"
                  >
                    沒有簽核關卡。
                  </td>
                </tr>
              ) : (
                steps.map((step) => (
                  <tr key={step.step_id || step.step_no}>
                    <td className="border border-gray-300 px-2 py-2">
                      {String(step.step_no).padStart(3, '0')}
                    </td>

                    <td className="border border-gray-300 px-2 py-2">
                      {step.step_name || '-'}
                    </td>

                    <td className="border border-gray-300 px-2 py-2">
                      {step.approver_name || '-'}
                    </td>

                    <td className="border border-gray-300 px-2 py-2">
                      {step.approver_miss_name || '-'}
                    </td>

                    <td className="border border-gray-300 px-2 py-2">
                      {step.approver_branch_name || '-'}
                    </td>

                    <td className="border border-gray-300 px-2 py-2">
                      <StatusBadge status={step.status} />
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      key: 'history',
      label: '歷史版本',
      children: renderHistoryTab(),
    },
  ];

  if (canWithdraw) {
    tabItems.push({
      key: 'withdraw',
      label: '抽單',
      children: (
        <div className="p-4">
          <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="mb-2 text-base font-bold">抽單說明</div>

            <div className="leading-7">
              抽單後，此文件會從目前簽核流程中撤回，原簽核流程將作廢。
              文件會回到可重新送出的狀態，填報者可修改後再次送出簽核。
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded border border-gray-300">
            <table className="w-full border-collapse text-sm">
              <tbody>
              <tr>
                <td className="w-[120px] border border-gray-300 bg-gray-100 px-3 py-2 font-semibold">
                  文件名稱
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {documentTitle || '-'}
                </td>
              </tr>

              <tr>
                <td className="border border-gray-300 bg-gray-100 px-3 py-2 font-semibold">
                  填報者
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {applicant?.USER_NAME || '-'} /{' '}
                  {applicant?.MISS_NAME || '-'}
                </td>
              </tr>

              <tr>
                <td className="border border-gray-300 bg-gray-100 px-3 py-2 font-semibold">
                  填報單位
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {applicant?.BRANCH_NAME || '-'}
                </td>
              </tr>

              <tr>
                <td className="border border-gray-300 bg-gray-100 px-3 py-2 font-semibold">
                  目前狀態
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {statusTextMap[instance?.status] ||
                    statusTextMap[instance?.approval_status] ||
                    instance?.status ||
                    instance?.approval_status ||
                    '-'}
                </td>
              </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded border border-gray-300 bg-gray-50">
            <div className="flex items-center justify-between border-b border-gray-300 px-3 py-2 font-semibold text-gray-700">
              <Popover
                content={renderWithdrawPopoverContent()}
                trigger="hover"
                placement="bottomLeft"
                open={withdrawPopoverOpen}
                onOpenChange={setWithdrawPopoverOpen}
              >
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-gray-700 hover:text-blue-600"
                >
                  抽單原因
                  <span className="ml-1 text-xs text-gray-500">▼</span>
                </button>
              </Popover>
            </div>

            <div className="p-3">
              <TextArea
                rows={5}
                value={withdrawOpinion}
                onChange={(e) => setWithdrawOpinion(e.target.value)}
                placeholder="請輸入抽單原因。"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button danger loading={loading} onClick={handleWithdraw}>
              確認抽單
            </Button>
          </div>
        </div>
      ),
    });
  }

  /**
   * ✅ 只有簽核意見 TAB 才顯示底部送出 / 同意 / 退回
   */
  const showFooterSubmitButton = activeTabKey === 'sign';

  return (
    <Modal
      title={null}
      open={open}
      footer={null}
      closable={false}
      centered
      width={980}
      destroyOnClose
      className="approval-sign-modal"
      onCancel={handleClose}
    >
      <div className="overflow-hidden rounded-md bg-white">
        <div className="flex items-center justify-between bg-[#007f95] px-4 py-3 text-white">
          <div className="text-lg font-bold">{modalTitle}</div>

          <button
            type="button"
            className="text-xl leading-none text-white hover:text-gray-200"
            onClick={handleClose}
          >
            ×
          </button>
        </div>

        <div className="border-b bg-gray-50 px-4 py-3">
          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
            <div className="md:col-span-2">
              <span className="font-semibold text-gray-600">文件名稱：</span>
              <span className="text-gray-800">{documentTitle || '-'}</span>
            </div>

            <div>
              <span className="font-semibold text-gray-600">填報者：</span>
              <span className="text-gray-800">
                {applicant?.USER_NAME || '-'} / {applicant?.MISS_NAME || '-'}
              </span>
            </div>

            <div>
              <span className="font-semibold text-gray-600">填報單位：</span>
              <span className="text-gray-800">
                {applicant?.BRANCH_NAME || '-'}
              </span>
            </div>
          </div>
        </div>

        <Tabs
          activeKey={activeTabKey}
          onChange={setActiveTabKey}
          className="approval-tabs"
          items={tabItems}
        />

        <div className="flex justify-end gap-2 border-t bg-gray-100 px-4 py-3">
          <Button onClick={handleClose}>關閉</Button>

          {showFooterSubmitButton && isSubmitMode && (
            <Button type="primary" loading={loading} onClick={handleSubmit}>
              送出
            </Button>
          )}

          {showFooterSubmitButton && isApproveMode && (
            <>
              <Button danger loading={loading} onClick={handleReturn}>
                退回
              </Button>

              <Button type="primary" loading={loading} onClick={handleApprove}>
                同意
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

const StepBox = ({ title, step, emptyText }) => {
  return (
    <div className="rounded border border-gray-300 bg-white">
      <div className="border-b border-gray-300 bg-gray-100 px-3 py-2 font-semibold text-gray-700">
        {title}
      </div>

      {!step ? (
        <div className="px-3 py-4 text-sm text-gray-400">{emptyText}</div>
      ) : (
        <div className="space-y-1 px-3 py-3 text-sm">
          <div>
            <span className="font-semibold text-gray-600">關卡：</span>
            {step.step_name || '-'}
          </div>

          <div>
            <span className="font-semibold text-gray-600">
              {Number(step.step_no) === 0 ? '目前人員：' : '簽核者：'}
            </span>
            {step.approver_name || '-'}
          </div>

          <div>
            <span className="font-semibold text-gray-600">職稱：</span>
            {step.approver_miss_name || '-'}
          </div>

          <div>
            <span className="font-semibold text-gray-600">單位：</span>
            {step.approver_branch_name || '-'}
          </div>

          <div>
            <span className="font-semibold text-gray-600">狀態：</span>
            <StatusBadge status={step.status} />
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const classNameMap = {
    pending: 'bg-blue-100 text-blue-700',
    waiting: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    returned: 'bg-red-100 text-red-700',
    rejected: 'bg-red-100 text-red-700',
    withdrawn: 'bg-purple-100 text-purple-700',
    draft: 'bg-gray-100 text-gray-700',
    cancel: 'bg-gray-100 text-gray-700',
  };
  return (
    <span
      className={[
        'inline-flex rounded px-2 py-0.5 text-xs font-semibold',
        classNameMap[status] || 'bg-gray-100 text-gray-700',
      ].join(' ')}
    >
      {statusTextMap[status] || status || '-'}
    </span>
  );
};

export default ApprovalSignModal;
