import { useEffect, useState } from "react";
import {
  AppraisalAutExcelCallBack,
  documentUrl,
  getExcelNameById,
  getExcelFileVersionById,
  mybaseUrl,
  onlyOfficeCallbackBaseUrl,
  onlyOfficeServer,
} from "@/networkReuest/Myaxios";
import ROUTENAME from "../../../../config/routesName";
import { DocumentEditor } from "@onlyoffice/document-editor-react";
import { history, useModel } from "@umijs/max";
import { ScaleTransform } from "../../../../utils/ScaleTransform";
import { useOnlyOfficePreviewGuard } from "@/hooks/useOnlyOfficePreviewGuard";
import OnlyOfficeStatusNotice from "@/components/OnlyOfficeStatusNotice";
import OnlyOfficePreviewFeedback from "@/components/OnlyOfficePreviewFeedback";

const PreviewAppraisalAutExcel = () => {
  const { initialState } = useModel("@@initialState");

  const editorId = "Editor";

  const [documentEditor, setDocumentEditor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [fallbackDownload, setFallbackDownload] = useState(null);
  const documentId = new URL(window.location.href).searchParams.get("DocumentId");
  const {
    leaseReady,
    leaseError,
    isOnline,
    isEditable,
    accessRevoked,
    setEditable,
  } = useOnlyOfficePreviewGuard(documentId);
  const onDocumentReady = function () {
    console.warn("Document is loaded");
    setLoading(false);
  };

  // 不讓 OnlyOffice 在 iframe 內用舊 session 自行重載檔案。
  // 它偵測到來源版本變更時，改由外層頁重新向伺服器取得最新安全快照。
  const onOutdatedVersion = function () {
    const reloadKey = `onlyoffice-outdated:${window.location.href}`;
    const now = Date.now();
    const lastReloadAt = Number(window.sessionStorage.getItem(reloadKey) || 0);

    // 防止網路異常時無限重整；正常版本切換只會重新載入一次。
    if (now - lastReloadAt < 10000) {
      return;
    }

    window.sessionStorage.setItem(reloadKey, String(now));
    window.location.reload();
  };

  const onLoadComponentError = function (errorCode, errorDescription) {
    setLoading(false);
    setLoadError(errorDescription || `OnlyOffice 載入失敗（錯誤碼 ${errorCode}）`);
    switch (errorCode) {
      case -1:
        console.log("Unknown error loading component:", errorDescription);
        break;

      case -2:
        console.log("Error load DocsAPI:", errorDescription);
        break;

      case -3:
        console.log("DocsAPI is not defined:", errorDescription);
        break;

      default:
        console.log("OnlyOffice error:", errorCode, errorDescription);
        break;
    }
  };

  /**
   * ✅ 是否為歷史文件預覽
   *
   * 網址範例：
   * /xxx?DocumentId=xxx&historyVersionId=123
   * /xxx?DocumentId=xxx&history=1&historyVersionId=123
   * /xxx?DocumentId=xxx&readonly=1&historyVersionId=123
   */
  const isHistoryPreviewByParams = (params) => {
    return (
      params.get("history") === "1" ||
      params.get("readonly") === "1" ||
      !!params.get("historyVersionId")
    );
  };

  /**
   * ✅ 組歷史文件 URL
   *
   * 後端回傳 version_file_path，例如：
   * office/excel/history/EmployeeAutExcelHistory/xxx.xlsx
   */
  const buildFileUrlByRelativePath = (relativePath) => {
    const cleanPath = String(relativePath || "").replace(/^\/+/, "");

    if (!cleanPath) return "";

    return encodeURI(`${documentUrl}/${cleanPath}`);
  };

  /**
   * ✅ 判斷 OnlyOffice 模式
   *
   * 歷史文件：
   * - 永遠 view
   * - 不給 callbackUrl
   *
   * 主檔：
   * - 未送出：建立者 edit
   * - 簽核中：目前簽核者 edit
   * - 人事 admin_type === 1 預設 view
   * - 總幹事 6868 可 edit
   */
  const getOfficeMode = ({ excelData, loginUser, isHistoryPreview }) => {
    if (isHistoryPreview) {
      return "view";
    }

    const adminType = String(loginUser?.admin_type || "");
    const loginUserId = String(loginUser?.USER_ID || "");

    const excelSend = String(excelData?.excel_Send || "");
    const createUser = String(
      excelData?.create_user || excelData?.create_userId || "",
    );

    const currentApproverUserId = String(
      excelData?.current_approver_user_id || "",
    );

    const approvalStatus = String(excelData?.approval_status || "");

    // 完成後不可再由任何身分（包括管理員）修改正式主檔。
    if (["completed", "approved"].includes(approvalStatus)) {
      return "view";
    }

    const isNotSend = excelSend === "0";
    const isCreator = createUser === loginUserId;

    const isCurrentApprover =
      approvalStatus === "pending" &&
      currentApproverUserId &&
      currentApproverUserId === loginUserId;

    const isHumanResourceAdmin = adminType === "1";
    const isSuperAdmin = adminType === "1" && loginUserId === "6868";

    let nextMode = "view";

    if (isNotSend && isCreator) {
      nextMode = "edit";
    }

    if (!isNotSend && isCurrentApprover) {
      nextMode = "edit";
    }

    if (isHumanResourceAdmin && !isCurrentApprover) {
      nextMode = "view";
    }

    if (isSuperAdmin) {
      nextMode = "edit";
    }

    return nextMode;
  };

  /**
   * ✅ 建立 editRoundKey
   *
   * 目的：
   * 同一個人、同一個簽核階段，多次修改只更新同一份歷史版本。
   */
  const buildEditRoundKey = ({ excelData }) => {
    const approvalStatus = String(excelData?.approval_status || "");
    const currentStepId = excelData?.current_step_id || "";
    const currentStepNo = excelData?.current_step_no || "";

    if (approvalStatus === "pending" && currentStepId) {
      return `step_${currentStepId}`;
    }

    if (approvalStatus === "returned") {
      return `return_${excelData?.return_count || currentStepNo || "1"}`;
    }

    if (!approvalStatus || approvalStatus === "draft") {
      return `draft_${currentStepNo || "0"}`;
    }

    return `${approvalStatus}_${currentStepId || currentStepNo || "0"}`;
  };

  /**
   * ✅ 主檔 callbackUrl
   *
   * 歷史文件不帶 callbackUrl。
   */
  const buildCallbackUrl = ({
                              excelName,
                              documentId,
                              excelData,
                              loginUser,
                              isHistoryPreview,
                            }) => {
    if (isHistoryPreview) {
      return undefined;
    }

    const approvalId = excelData?.approval_id || "";
    const approvalStepId = excelData?.current_step_id || "";
    const editRoundKey = buildEditRoundKey({ excelData });

    return (
      `${onlyOfficeCallbackBaseUrl}/${AppraisalAutExcelCallBack}` +
      `?documentName=${encodeURIComponent(excelName)}` +
      `&excelId=${encodeURIComponent(documentId || "")}` +
      `&approvalId=${encodeURIComponent(approvalId)}` +
      `&approvalStepId=${encodeURIComponent(approvalStepId)}` +
      `&editRoundKey=${encodeURIComponent(editRoundKey)}` +
      `&editorUserId=${encodeURIComponent(loginUser?.USER_ID || "")}` +
      `&editorUserName=${encodeURIComponent(loginUser?.USER_NAME || "")}` +
      `&editorMissName=${encodeURIComponent(loginUser?.MISS_NAME || "")}` +
      `&editorBranchName=${encodeURIComponent(loginUser?.BRANCH_NAME || "")}`
    );
  };

  /**
   * ✅ 建立 OnlyOffice Editor
   */
  const buildDocumentEditor = ({
                                 documentId,
                                 historyVersionId,
                                 excelName,
                                 fileUrl,
                                 excelData,
                                 loginUser,
                                 officeMode,
                                 callbackUrl,
                                 isHistoryPreview,
                               }) => {
    const editRoundKey = isHistoryPreview
      ? "history_view"
      : buildEditRoundKey({ excelData });

    const documentKey = isHistoryPreview
      ? `history_${documentId}_${historyVersionId}_${Date.now()}`
      : officeMode === "view"
        ? `preview_${documentId}_${excelData?.document_source_revision || excelData?.document_revision || "0"}`
        : `${documentId}_${excelData?.approval_id || "draft"}_${
          excelData?.current_step_id || "0"
        }_${editRoundKey}_${excelData?.document_revision || "0"}_stable_url`;

    return (
      <DocumentEditor
        style={{ width: "100%", height: "100%" }}
        id={editorId}
        documentServerUrl={onlyOfficeServer}
        config={{
          events: {
            onDocumentReady,
            onOutdatedVersion,
          },
          document: {
            fileType: "xlsx",
            title: excelName,
            url: fileUrl,
            key: documentKey,

            permissions: {
              chat: !isHistoryPreview,
              edit: officeMode === "edit" && !isHistoryPreview,
              download: true,
              print: true,
              review: false,
              comment: false,
              copy: true,
              modifyContentControl: false,
              modifyFilter: false,
              fillForms: false,
              // 隱藏協作者清單、游標名稱與彩色多人提示，保留即時共同編輯。
              userInfoGroups: [],
            },
          },

          editorConfig: {
            mode: officeMode,
            coEditing: {
              mode: "fast",
              // 統一鎖定即時同步，避免瀏覽器記住 strict 模式後各分頁畫面不同。
              change: false,
            },

            ...(callbackUrl ? { callbackUrl } : {}),

            customization: {
              autosave: !isHistoryPreview,
              forcesave: !isHistoryPreview,
              anonymous: {
                request: false,
              },

              comments: !isHistoryPreview,
              compactHeader: false,
              compactToolbar: false,
              compatibleFeatures: false,
              help: false,
              hideRightMenu: true,
              hideRulers: true,
              integrationMode: "embed",
              logo: {
                url: "",
              },
              macros: !isHistoryPreview,
              macrosMode: isHistoryPreview ? "Disable" : "Warn",
              mentionShare: false,
              mobileForceView: true,
              plugins: false,
              toolbarHideFileName: false,
              toolbarNoTabs: false,
              zoom: ScaleTransform.getOnlyOfficeZoom(1.1),
            },

            lang: "zh-tw",

            user: {
              // 同一登入者在不同分頁使用同一 ID，避免被顯示成多名協作者。
              id: String(loginUser?.USER_ID || "anonymous"),
              name: loginUser?.USER_NAME,
            },
          },
        }}
        events_onDocumentReady={onDocumentReady}
        onLoadComponentError={onLoadComponentError}
      />
    );
  };

  /**
   * ✅ 開啟歷史文件
   */
  const openHistoryExcel = async ({
                                    documentId,
                                    historyVersionId,
                                    loginUser,
                                  }) => {
    setEditable(false);
    if (!historyVersionId) {
      console.warn("缺少 historyVersionId");
      setLoading(false);
      setLoadError("缺少歷史文件版本資料");
      return;
    }

    const result = await getExcelFileVersionById({
      excelId: documentId,
      historyVersionId,
    });

    const { success, message } = result.data;

    if (success !== 1) {
      console.warn("查無歷史文件版本", result.data);
      setLoading(false);
      setLoadError(result?.data?.message || "查無歷史文件");
      return;
    }

    const version = message || {};
    const excelName = version?.version_file_name || "中秋歷史文件.xlsx";
    const fileUrl = buildFileUrlByRelativePath(version?.version_file_path);

    if (!fileUrl) {
      console.warn("歷史文件路徑不存在");
      setLoading(false);
      setLoadError("歷史文件路徑不存在");
      return;
    }

    console.log("OnlyOffice autumn history preview");
    console.log("historyVersionId =", historyVersionId);
    console.log("fileUrl =", fileUrl);
    console.log("version =", version);
    setFallbackDownload({
      fileUrl: encodeURI(`${mybaseUrl}/${String(version?.version_file_path || "").replace(/^\/+/, "")}`),
      fileName: excelName,
    });

    setTimeout(() => {
      setDocumentEditor(
        buildDocumentEditor({
          documentId,
          historyVersionId,
          excelName,
          fileUrl,
          excelData: {},
          loginUser,
          officeMode: "view",
          callbackUrl: undefined,
          isHistoryPreview: true,
        }),
      );
    }, 50);
  };

  /**
   * ✅ 開啟正式主檔
   */
  const openMainExcel = async ({ documentId, loginUser }) => {
    const result = await getExcelNameById(documentId);
    const { success, message } = result.data;

    if (success !== 1) {
      console.warn("查無 Excel 資料", result.data);
      setLoading(false);
      setLoadError(result?.data?.message || "查無中秋獎金調查表");
      return;
    }

    const excelData = message || {};
    const excelName = excelData?.excel_Name;

    if (!excelName) {
      console.warn("缺少 excel_Name");
      setLoading(false);
      setLoadError("文件名稱遺失，無法開啟中秋獎金調查表");
      return;
    }

    const officeMode = getOfficeMode({
      excelData,
      loginUser,
      isHistoryPreview: false,
    });
    setEditable(officeMode === "edit");

    const versionedFileUrl = excelData?.document_file_url
      ? `${documentUrl}${excelData.document_file_url}`
      : encodeURI(
          `${documentUrl}/office/excel/EmployeeAutExcel/${excelName}`,
        );
    // 可編輯文件的 key 代表同一個共同編輯工作階段；來源 URL 也必須
    // 維持穩定。安全快照更新若連帶改變 ?v=mtime，OnlyOffice 會把
    // 同一個 key 判定為 UpdateVersion expired 並讓預覽一直轉圈。
    // 唯讀主預覽仍保留版本化 URL，避免讀到舊快取。
    const fileUrl = officeMode === "edit"
      ? versionedFileUrl.replace(/\?v=[^#]*/, "")
      : versionedFileUrl;
    setFallbackDownload({
      fileUrl: excelData?.document_file_url
        ? `${mybaseUrl}${excelData.document_file_url}`
        : encodeURI(`${mybaseUrl}/office/excel/EmployeeAutExcel/${excelName}`),
      fileName: excelName,
    });

    const callbackUrl = buildCallbackUrl({
      excelName,
      documentId,
      excelData,
      loginUser,
      isHistoryPreview: false,
    });

    const editRoundKey = buildEditRoundKey({ excelData });

    console.log("OnlyOffice mode =", officeMode);
    console.log("editRoundKey =", editRoundKey);
    console.log("callbackUrl =", callbackUrl);
    console.log("excelData =", excelData);

    setTimeout(() => {
      setDocumentEditor(
        buildDocumentEditor({
          documentId,
          historyVersionId: "",
          excelName,
          fileUrl,
          excelData,
          loginUser,
          officeMode,
          callbackUrl,
          isHistoryPreview: false,
        }),
      );
    }, 50);
  };

  /**
   * ✅ 入口
   */
  const getExcelNameFetch = async (documentId) => {
    try {
      const params = new URL(window.location.href).searchParams;

      const isHistoryPreview = isHistoryPreviewByParams(params);
      const historyVersionId = params.get("historyVersionId");

      if (!documentId) {
        console.warn("缺少 DocumentId");
        setLoading(false);
        setLoadError("缺少文件識別碼");
        history.replace(ROUTENAME.employee_appraisalTabs);
        return;
      }

      const loginUser = initialState?.user || {};

      if (isHistoryPreview) {
        await openHistoryExcel({
          documentId,
          historyVersionId,
          loginUser,
        });

        return;
      }

      await openMainExcel({
        documentId,
        loginUser,
      });
    } catch (e) {
      console.error(e);
      setLoading(false);
      setLoadError(e?.response?.data?.message || e?.message || "讀取中秋獎金調查表失敗");
    }
  };

  useEffect(() => {
    ScaleTransform.apply();

    if (Object.keys(initialState?.user || {}).length === 0) {
      return history.replace(ROUTENAME.Login);
    }

    if (leaseError) {
      setLoading(false);
      setLoadError(leaseError);
      return undefined;
    }

    if (!leaseReady) {
      return undefined;
    }

    getExcelNameFetch(documentId);
    return undefined;
  }, [leaseReady, leaseError]);

  // DocumentEditor 的 script 或 iframe 偶爾不會拋出錯誤事件。不能讓畫面
  // 永遠停在轉圈；逾時後保留重新預覽與直接下載兩條可恢復路徑。
  useEffect(() => {
    if (!loading || !documentEditor) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setLoading(false);
      setLoadError(
        "ONLYOFFICE 預覽服務回應較慢或暫時無法連線，請重新嘗試；原始 Excel 仍可直接下載。",
      );
    }, 20000);

    return () => window.clearTimeout(timer);
  }, [loading, documentEditor]);

  return (
    <div
      className="editor-wrapper"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <OnlyOfficeStatusNotice
        leaseError={leaseError}
        isOnline={isOnline}
        isEditable={isEditable}
        accessRevoked={accessRevoked}
      />
      <OnlyOfficePreviewFeedback
        loading={loading}
        error={loadError}
        title="中秋獎金調查表"
        fallbackDownload={fallbackDownload}
      />
      {documentEditor}
    </div>
  );
};

export default PreviewAppraisalAutExcel;
