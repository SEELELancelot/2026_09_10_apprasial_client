import { DocumentEditor } from "@onlyoffice/document-editor-react";
import { useEffect, useRef, useState } from "react";
import { history, useModel } from "@umijs/max";
import { Modal, Spin } from "antd";

import {
  AppraisalRecordExcelCallback,
  createEmployeeAppraisalExcel,
  documentUrl,
  mybaseUrl,
  onlyOfficeServer,
} from "@/networkReuest/Myaxios";

import ROUTENAME from "../../../../config/routesName";
import { InitDataFetchMethod } from "@/getInitDropDown/getInitDropDown";
import { ScaleTransform } from "../../../../utils/ScaleTransform";

const CreateAppraisalRecordExcel = () => {
  const { initialState } = useModel("@@initialState");

  const editorId = "Editor";

  const hasGeneratedRef = useRef(false);

  const [documentEditor, setDocumentEditor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("正在建立平時考核表...");

  const onDocumentReady = function () {
    console.warn("🎉 Appraisal Record Excel Document is loaded");
    setLoading(false);
  };

  const onLoadComponentError = function (errorCode, errorDescription) {
    console.error("OnlyOffice 加載錯誤：", errorCode, errorDescription);
    setLoading(false);
  };

  /**
   * ✅ 建立 callbackUrl
   *
   * 第一次建立時：
   * - approvalId 還沒有
   * - approvalStepId 還沒有
   * - editRoundKey 固定 draft_0
   *
   * 目的：
   * OnlyOffice status = 2 callback 時，
   * 後端可以依 excelId 建立 / 更新草稿階段歷史版本。
   */
  const buildCreateCallbackUrl = ({ excelName, excelId }) => {
    const loginUser = initialState?.user || {};

    return (
      `${mybaseUrl}/${AppraisalRecordExcelCallback}` +
      `?documentName=${encodeURIComponent(excelName || "")}` +
      `&excelId=${encodeURIComponent(excelId || "")}` +
      `&approvalId=` +
      `&approvalStepId=` +
      `&editRoundKey=${encodeURIComponent("draft_0")}` +
      `&editorUserId=${encodeURIComponent(loginUser?.USER_ID || "")}` +
      `&editorUserName=${encodeURIComponent(loginUser?.USER_NAME || "")}` +
      `&editorMissName=${encodeURIComponent(loginUser?.MISS_NAME || "")}` +
      `&editorBranchName=${encodeURIComponent(loginUser?.BRANCH_NAME || "")}`
    );
  };

  /**
   * ✅ 建立 OnlyOffice Editor
   */
  const buildDocumentEditor = ({ excelName, excelId, fileUrl, callbackUrl }) => {
    const loginUser = initialState?.user || {};

    /**
     * ✅ document.key 必須能區分每一份新建文件
     * 避免 OnlyOffice 快取到舊文件。
     */
    const documentKey = `${excelId}_draft_0_draft_0`;

    return (
      <DocumentEditor
        style={{ width: "100%", height: "100%" }}
        id={editorId}
        documentServerUrl={onlyOfficeServer}
        config={{
          document: {
            fileType: "xlsx",
            title: excelName || "員工考核紀錄",
            url: fileUrl,
            key: documentKey,

            permissions: {
              chat: true,
              edit: true,
              download: true,
              print: true,
              review: false,
              comment: true,
              copy: true,
              modifyContentControl: true,
              modifyFilter: true,
              fillForms: true,
            },
          },

          editorConfig: {
            mode: "edit",
            callbackUrl,
            coEditing: {
              mode: "fast",
              change: true,
            },

            customization: {
              autosave: true,
              forcesave: true,
              anonymous: {
                request: false,
              },
              comments: true,
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
              macros: true,
              macrosMode: "Warn",
              mentionShare: true,
              mobileForceView: true,
              plugins: false,
              toolbarHideFileName: false,
              toolbarNoTabs: false,
              zoom: ScaleTransform.getOnlyOfficeZoom(1.1),
            },

            lang: "zh-tw",

            user: {
              id: loginUser?.USER_ID,
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
   * ✅ 建立平時考核 Excel
   */
  const generateNewExcel = async () => {
    try {
      setLoading(true);
      setLoadingText("正在建立平時考核表...");

      const result = await createEmployeeAppraisalExcel();

      /**
       * ✅ 後端必須回傳：
       * {
       *   success: 1,
       *   message: "製造成功",
       *   excelId: "...",
       *   excelName: "..."
       * }
       */
      const { success, excelName, excelId, message } = result.data || {};

      if (success !== 1) {
        console.warn("建立平時考核 Excel 失敗：", message);
        setLoadingText(message || "建立平時考核表失敗");
        setLoading(false);
        return;
      }

      if (!excelName) {
        console.warn("後端未回傳 excelName");
        setLoadingText("後端未回傳 excelName");
        setLoading(false);
        return;
      }

      if (!excelId) {
        console.warn("後端未回傳 excelId，歷史版本將無法建立");
      }

      setLoadingText("正在開啟 OnlyOffice 編輯器...");

      const fileUrl = encodeURI(
        `${documentUrl}/office/excel/EmployeeAppraisalExcelManager/${excelName}`,
      );

      const callbackUrl = buildCreateCallbackUrl({
        excelName,
        excelId,
      });

      console.log("create appraisal record excelName =", excelName);
      console.log("create appraisal record excelId =", excelId);
      console.log("create appraisal record fileUrl =", fileUrl);
      console.log("create appraisal record callbackUrl =", callbackUrl);

      /**
       * ✅ 通知父頁：平時考核 Excel 已建立完成
       */
      window.opener?.postMessage(
        {
          type: "NORMAL_APPRAISAL_EXCEL_CREATED",
          excelName,
          excelId,
        },
        window.location.origin,
      );

      // 重新載入正式預覽頁，讓它以主檔版本 key 開始共同編輯；
      // 不回列表，也不會重複建立新檔。
      window.location.replace(
        `${ROUTENAME.PreviewAppraisalRecordExcel}?DocumentId=${encodeURIComponent(excelId)}`,
      );
      return;

      setTimeout(() => {
        setDocumentEditor(
          buildDocumentEditor({
            excelName,
            excelId,
            fileUrl,
            callbackUrl,
          }),
        );
      }, 300);
    } catch (e) {
      console.error("generateNewExcel error:", e);
      if (e?.response?.data?.code === "EXCEL_TYPE_DISABLED") {
        setLoadingText("考核已結束，請重新整理");
        setLoading(false);
        Modal.warning({
          title: "考核已結束",
          content: "此考核已關閉，請重新整理原本清單後再操作。",
          onOk: () => {
            window.opener?.location.reload();
            window.close();
          },
        });
        return;
      }
      setLoadingText("建立平時考核表發生錯誤");
      setLoading(false);
    }
  };

  useEffect(() => {
    ScaleTransform.apply();

    /**
     * ⛔ 尚未登入，導向登入頁
     */
    if (Object.keys(initialState?.user || {}).length === 0) {
      return history.replace(ROUTENAME.Login);
    }

    /**
     * ✅ 防止 React StrictMode / 重複 render 建立兩份 Excel
     */
    if (hasGeneratedRef.current) {
      return;
    }

    /**
     * ✅ 首次進入 → 建立新 Excel
     */
    if (window.name === "") {
      hasGeneratedRef.current = true;
      window.name = "isReload";
      generateNewExcel();
      return;
    }

    /**
     * ✅ 已建立後重新整理 → 回列表頁
     */
    if (window.name === "isReload") {
      hasGeneratedRef.current = true;

      console.log("🔁 page refresh....");
      setLoading(true);
      setLoadingText("頁面重新整理中，返回列表...");

      history.push(ROUTENAME.employee_appraisalTabs);
      InitDataFetchMethod.AllTableData();
    }
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
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 9999,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <Spin size="large" />

          <div
            style={{
              marginTop: 16,
              fontSize: 16,
              color: "#555",
            }}
          >
            {loadingText}
          </div>
        </div>
      )}

      {documentEditor}
    </div>
  );
};

export default CreateAppraisalRecordExcel;
