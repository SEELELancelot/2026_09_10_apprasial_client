import {useEffect, useRef, useState} from "react";
import ROUTENAME from "../../../../config/routesName";
import {history,useModel} from "@umijs/max";
import { Modal, Spin } from 'antd';

import {
  createExportAutExcel,
} from '@/networkReuest/Myaxios';
import {InitDataFetchMethod} from "@/getInitDropDown/getInitDropDown";
import {ScaleTransform} from "../../../../utils/ScaleTransform";

const CreateHolidayAutExcel = () => {
  const { initialState } = useModel('@@initialState');

  const hasGeneratedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('正在建立中秋獎金調查表...');

  const generateNewExcel = async () => {
    let result;
    try {
      setLoading(true);
      setLoadingText('正在建立中秋獎金調查表...');
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
      setLoadingText('正在開啟 OnlyOffice 編輯器...');

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
    }

    setLoading(false);
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
    if (hasGeneratedRef.current) return;

    if (window.name === "") {
      hasGeneratedRef.current = true;
      window.name = "isReload";
      generateNewExcel();
    }
    // 已建立 → 頁面刷新
    else if (window.name === "isReload") {
      hasGeneratedRef.current = true;
      console.log("🔁 page refresh....");
      history.push(ROUTENAME.employee_appraisalTabs); //
      InitDataFetchMethod.AllTableData(); // ✅ fetch模型
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
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <Spin size="large" />
          <span>{loadingText}</span>
        </div>
      )}
    </div>
  )
};

export default CreateHolidayAutExcel;
