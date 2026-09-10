import { useEffect, useState } from "react";
import {
  AppraisalBonusExcelCallBack,
  documentUrl,
  getExcelNameById,
  getExcelFileVersionById,
  mybaseUrl,
  onlyOfficeServer,
} from "@/networkReuest/Myaxios";
import ROUTENAME from "../../../../config/routesName";
import { DocumentEditor } from "@onlyoffice/document-editor-react";
import { history, useModel } from "@umijs/max";
import { ScaleTransform } from "../../../../utils/ScaleTransform";

const PreviewAppraisalBonusExcel = () => {
  const { initialState } = useModel("@@initialState");

  const editorId = "Editor";

  const [documentEditor, setDocumentEditor] = useState(null);
  // 同一帳號多開分頁時，每個分頁使用獨立協作 session，仍共用同一文件 key。
  const [onlyOfficeSessionId] = useState(
    () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
  );

  const onDocumentReady = function () {
    console.warn("Document is loaded");
  };

  const onLoadComponentError = function (errorCode, errorDescription) {
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
   * 安全規則：
   * 1. 前端網址只帶 historyVersionId
   * 2. 不吃 historyFilePath
   * 3. 真實檔案路徑由後端 getExcelFileVersionById 查 DB 回傳
   */
  const isHistoryPreviewByParams = (params) => {
    return (
      params.get("history") === "1" ||
      params.get("readonly") === "1" ||
      !!params.get("historyVersionId")
    );
  };

  /**
   * ✅ 組檔案 URL
   *
   * 後端回傳 version_file_path，例如：
   * office/excel/history/EmployeeBonusExcelHistory/xxx.xlsx
   */
  const buildFileUrlByRelativePath = (relativePath) => {
    const cleanPath = String(relativePath || "").replace(/^\/+/, "");

    if (!cleanPath) return "";

    return encodeURI(`${mybaseUrl}/${cleanPath}`);
  };

  /**
   * ✅ 判斷 OnlyOffice 模式
   *
   * 歷史文件：
   * - 永遠 view
   * - 永遠不能 edit
   * - 不給 callbackUrl
   *
   * 主檔：
   * - 未送出：建立者 edit
   * - 簽核中：目前關卡簽核者 edit
   * - 人事 admin_type === 1 預設 view
   * - 6868 可 edit
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
   * 歷史文件不會呼叫這個。
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
      `${mybaseUrl}/${AppraisalBonusExcelCallBack}` +
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
      : `${documentId}_${excelData?.approval_id || "draft"}_${
        excelData?.current_step_id || "0"
      }_${editRoundKey}_${excelData?.document_revision || "0"}`;

    return (
      <DocumentEditor
        style={{ width: "100%", height: "100%" }}
        id={editorId}
        documentServerUrl={onlyOfficeServer}
        config={{
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
            },
          },

          editorConfig: {
            mode: officeMode,
            coEditing: {
              mode: "fast",
              change: true,
            },

            // ✅ 歷史文件不帶 callbackUrl
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
              id: `${loginUser?.USER_ID || 'anonymous'}_${onlyOfficeSessionId}`,
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
   *
   * 前端只拿 historyVersionId。
   * 真實路徑由後端查 DB 回傳。
   */
  const openHistoryExcel = async ({
                                    documentId,
                                    historyVersionId,
                                    loginUser,
                                  }) => {
    if (!historyVersionId) {
      console.warn("缺少 historyVersionId");
      return;
    }

    const result = await getExcelFileVersionById({
      excelId: documentId,
      historyVersionId,
    });

    const { success, message } = result.data;

    if (success !== 1) {
      console.warn("查無歷史文件版本", result.data);
      return;
    }

    const version = message || {};
    const excelName = version?.version_file_name || "歷史文件.xlsx";
    const fileUrl = buildFileUrlByRelativePath(version?.version_file_path);

    if (!fileUrl) {
      console.warn("歷史文件路徑不存在");
      return;
    }

    console.log("OnlyOffice history preview");
    console.log("historyVersionId =", historyVersionId);
    console.log("fileUrl =", fileUrl);
    console.log("version =", version);

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
    }, 300);
  };

  /**
   * ✅ 開啟正式主檔
   */
  const openMainExcel = async ({ documentId, loginUser }) => {
    const result = await getExcelNameById(documentId);
    const { success, message } = result.data;

    if (success !== 1) {
      console.warn("查無 Excel 資料", result.data);
      return;
    }

    const excelData = message || {};
    const excelName = excelData?.excel_Name;

    if (!excelName) {
      console.warn("缺少 excel_Name");
      return;
    }

    const fileUrl = excelData?.document_file_url
      ? `${documentUrl}${excelData.document_file_url}`
      : encodeURI(
          `${documentUrl}/office/excel/EmployeeBonusExcel/${excelName}`,
        );

    const officeMode = getOfficeMode({
      excelData,
      loginUser,
      isHistoryPreview: false,
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
    }, 300);
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
    }
  };

  useEffect(() => {
    ScaleTransform.apply();

    if (Object.keys(initialState?.user || {}).length === 0) {
      return history.replace(ROUTENAME.Login);
    }

    const params = new URL(window.location.href).searchParams;
    const documentId = params.get("DocumentId");

    getExcelNameFetch(documentId);
  }, []);

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
      {documentEditor}
    </div>
  );
};

export default PreviewAppraisalBonusExcel;
