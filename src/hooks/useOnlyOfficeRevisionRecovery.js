import { useEffect } from "react";
import { getExcelNameById } from "@/networkReuest/Myaxios";

/**
 * 使用者在上一個可編輯分頁剛關閉時立刻重開，OnlyOffice 的 status:2
 * callback 可能仍在寫回主檔。若主檔 revision 隨後改變，目前頁面拿到的
 * key 就屬於已結束的工作階段；偵測到後自動重載一次，取得新 revision。
 */
export const useOnlyOfficeRevisionRecovery = (documentId, documentRevision) => {
  useEffect(() => {
    if (!documentId || !documentRevision) {
      return undefined;
    }

    const initialRevision = String(documentRevision);
    const reloadKey = `onlyoffice-revision-reload:${documentId}:${initialRevision}`;
    let disposed = false;
    let checking = false;

    const checkRevision = async () => {
      if (disposed || checking) return;
      checking = true;
      try {
        const result = await getExcelNameById(documentId);
        const nextRevision = String(result?.data?.message?.document_revision || "");

        if (
          nextRevision &&
          nextRevision !== initialRevision &&
          !window.sessionStorage.getItem(reloadKey)
        ) {
          window.sessionStorage.setItem(reloadKey, "1");
          console.info("[OnlyOffice 預覽] 偵測到關閉回寫完成，改用新文件版本", {
            documentId,
            from: initialRevision,
            to: nextRevision,
          });
          window.location.reload();
        }
      } catch {
        // 這是短期恢復檢查；正式載入流程會負責顯示連線錯誤。
      } finally {
        checking = false;
      }
    };

    const firstCheckTimer = window.setTimeout(checkRevision, 1200);
    const interval = window.setInterval(checkRevision, 1500);
    const stopTimer = window.setTimeout(() => {
      window.clearInterval(interval);
    }, 20000);

    return () => {
      disposed = true;
      window.clearTimeout(firstCheckTimer);
      window.clearTimeout(stopTimer);
      window.clearInterval(interval);
    };
  }, [documentId, documentRevision]);
};
