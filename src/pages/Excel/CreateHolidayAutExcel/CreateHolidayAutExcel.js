import {DocumentEditor} from "@onlyoffice/document-editor-react";
import {useEffect, useState} from "react";
import ROUTENAME from "../../../../config/routesName";
import {history,useModel} from "@umijs/max";
import { Modal } from 'antd';

import {
  AppraisalAutExcelCallBack, createExportAutExcel,
  documentUrl,
  mybaseUrl,
  onlyOfficeServer,
} from '@/networkReuest/Myaxios';
import {InitDataFetchMethod} from "@/getInitDropDown/getInitDropDown";
import {ScaleTransform} from "../../../../utils/ScaleTransform";

const CreateHolidayAutExcel = () => {
  const { initialState } = useModel('@@initialState');

  // 初始預設 Excel 檔案為空白範本
  const [userDoc, setUserDoc] = useState(`${documentUrl}/office/excel/空白.xlsx`);
  const [editorId] = useState("HolidayEditor");

  const onDocumentReady = function () {
    console.warn("🎉 Holiday Bonus Excel Document is loaded");
  };

  const onLoadComponentError = function (errorCode, errorDescription) {
    console.error(`OnlyOffice load error: ${errorCode}`, errorDescription);
  };

  const generateNewExcel = async () => {
    let result;
    try {
      result = await createExportAutExcel();
    } catch (error) {
      if (error?.response?.data?.code === 'EXCEL_TYPE_DISABLED') {
        Modal.warning({
          title: '考核已結束',
          content: '此考核已關閉，請重新整理原本清單後再操作。',
          onOk: () => {
            window.opener?.location.reload();
            window.close();
          },
        });
        return;
      }

      console.error('建立中秋獎金調查表失敗：', error);
      Modal.error({
        title: '建立失敗',
        content: '無法建立中秋獎金調查表，請稍後再試。',
      });
      return;
    }
    const { success, excelName, excelId } = result.data || {};

    if (success === 1 && excelId) {
      const pathName = `${documentUrl}/office/excel/EmployeeAutExcel/${excelName}`;
      setUserDoc(pathName);

      const loginUser = initialState?.user || {};
      const callbackUrl =
        `${mybaseUrl}/${AppraisalAutExcelCallBack}` +
        `?documentName=${encodeURIComponent(excelName || '')}` +
        `&excelId=${encodeURIComponent(excelId)}` +
        `&approvalId=` +
        `&approvalStepId=` +
        `&editRoundKey=draft_0` +
        `&editorUserId=${encodeURIComponent(loginUser?.USER_ID || '')}` +
        `&editorUserName=${encodeURIComponent(loginUser?.USER_NAME || '')}` +
        `&editorMissName=${encodeURIComponent(loginUser?.MISS_NAME || '')}` +
        `&editorBranchName=${encodeURIComponent(loginUser?.BRANCH_NAME || '')}`;

      // ✅ 中秋 Excel 建立成功後，通知原本列表頁刷新
      window.opener?.postMessage(
        {
          type: 'HOLIDAY_EXCEL_CREATED',
          holiday: 'midAutumn',
          excelName,
        },
        window.location.origin,
      );

      // 以正式預覽頁的主檔版本 key 開始共同編輯。
      window.location.replace(
        `${ROUTENAME.PreviewAppraisalAutExcel}?DocumentId=${encodeURIComponent(excelId)}`,
      );
      return;

      setTimeout(() => {
        setDocumentEditor(
          <DocumentEditor
            style={{ width: '100%', height: '100%' }}
            id={editorId}
            documentServerUrl={onlyOfficeServer}
            config={{
              document: {
                fileType: "xlsx",
                title: "獎金發放調查紀錄",
                url: pathName,
                key: `${excelId}_draft_0_draft_0`,
                permissions: {
                  chat: true,
                  edit: true,
                  download: true,
                  print: true,
                },
              },
              editorConfig: {
                callbackUrl,
                mode: "edit",
                coEditing: {
                  mode: "fast",
                  change: true,
                },
                customization: {
                  autosave: true,
                  forcesave: true,
                  anonymous: { request: false },
                  comments: true,
                  compactHeader: false,
                  compactToolbar: false,
                  compatibleFeatures: false,
                  help: false,
                  hideRightMenu: true,
                  hideRulers: true,
                  integrationMode: "embed",
                  logo: { url: "" },
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
                  id: initialState?.user?.USER_ID,
                  name: initialState?.user?.USER_NAME,
                },
              },
            }}
            events_onDocumentReady={onDocumentReady}
            onLoadComponentError={onLoadComponentError}
          />
        );
      }, 300);
      return;
    }

    Modal.error({
      title: '建立失敗',
      content: '無法建立中秋獎金調查表，請稍後再試。',
    });
  };

  useEffect(() => {
    // ✨ 套用縮放修正
    ScaleTransform.apply();
    // ⛔ 尚未登入，導向登入頁
    if (Object.keys(initialState?.user || {}).length === 0) {
      return history.replace(ROUTENAME.Login);
    }

    // 首次進入 → 建立新 Excel
    if (window.name === "") {
      window.name = "isReload";
      generateNewExcel();
    }
    // 已建立 → 頁面刷新
    else if (window.name === "isReload") {
      console.log("🔁 page refresh....");
      history.push(ROUTENAME.employee_appraisalTabs); //
      InitDataFetchMethod.AllTableData(); // ✅ fetch模型
    }
  }, []);

  const [documentEditor, setDocumentEditor] = useState(
    <DocumentEditor
      style={{ width: '100%', height: '100%' }} // ✅ 用 CSS 控制高度
      id={editorId}
      documentServerUrl={onlyOfficeServer}
      config={{
        document: {
          fileType: "xlsx",
          title: "獎金發放調查紀錄",
          url: userDoc,
          permissions: {
            chat: true,
          },
        },
        editorConfig: {
          customization: {
            anonymous: { request: false },
            comments: true,
            compactHeader: false,
            compactToolbar: false,
            compatibleFeatures: false,
            help: false,
            hideRightMenu: true,
            hideRulers: true,
            integrationMode: "embed",
            logo: { url: "" },
            macros: true,
            macrosMode: "Warn",
            mentionShare: true,
            mobileForceView: true,
            plugins: false,
            toolbarHideFileName: false,
            toolbarNoTabs: false,
            zoom: ScaleTransform.getOnlyOfficeZoom(1.1), // 可選擇放大 10%
          },
          lang: "zh-tw",
          user: {
            id: initialState?.user?.USER_ID,
            name: initialState?.user?.USER_NAME,
          },
          mode: "edit",
        },
      }}
      events_onDocumentReady={onDocumentReady}
      onLoadComponentError={onLoadComponentError}
    />
  );

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
  )
};

export default CreateHolidayAutExcel;
