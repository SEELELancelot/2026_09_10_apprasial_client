import { useEffect, useRef, useState } from "react";
import {
  acquireOnlyOfficePreview,
  checkpointOnlyOfficeDocument,
  onlyOfficeServer,
  heartbeatOnlyOfficePreview,
  mybaseUrl,
  releaseOnlyOfficePreview,
} from "@/networkReuest/Myaxios";

const createTabId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
};

const sendKeepaliveRequest = (path, body) => {
  const token = window.localStorage.getItem("token");
  return window.fetch(`${mybaseUrl}/${path}`, {
    method: "POST",
    keepalive: true,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }).catch(() => undefined);
};

/**
 * OnlyOffice 預覽分頁租約與資料安全保護。
 * - 後端限制同帳號、同文件最多三個分頁。
 * - 每 30 秒續租，瀏覽器當機後 90 秒會自動回收。
 * - 可編輯文件每 2 分鐘要求一次低頻安全存檔；後端會再做文件級去重。
 */
export const useOnlyOfficePreviewGuard = (documentId) => {
  const tabIdRef = useRef(createTabId());
  const editableRef = useRef(false);
  const acquiredRef = useRef(false);
  const [leaseReady, setLeaseReady] = useState(false);
  const [leaseError, setLeaseError] = useState("");
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  // null 表示文件權限尚未判定，避免載入期間先閃出錯誤的「唯讀」提示。
  const [isEditable, setIsEditableState] = useState(null);
  const [accessRevoked, setAccessRevoked] = useState(false);

  // DocumentEditor 會在稍後才動態載入 DocsAPI；預先建立到文件服務的連線，
  // 可避免首次預覽時額外等待 DNS/TCP/TLS 建連，並讓後續分頁重用同一連線。
  useEffect(() => {
    if (!onlyOfficeServer || document.querySelector(`link[data-onlyoffice-preconnect="${onlyOfficeServer}"]`)) {
      return undefined;
    }

    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = onlyOfficeServer;
    link.crossOrigin = "anonymous";
    link.dataset.onlyofficePreconnect = onlyOfficeServer;
    document.head.appendChild(link);
    return undefined;
  }, []);

  const setEditable = (editable) => {
    const next = Boolean(editable);
    editableRef.current = next;
    setIsEditableState(next);
  };

  useEffect(() => {
    if (!documentId) {
      setLeaseError("缺少文件識別碼");
      return undefined;
    }

    let disposed = false;
    let heartbeatTimer;
    let checkpointTimer;
    const tabId = tabIdRef.current;

    const checkpoint = () => {
      if (acquiredRef.current && editableRef.current && window.navigator.onLine) {
        checkpointOnlyOfficeDocument(documentId).catch(() => undefined);
      }
    };

    const heartbeat = () => {
      heartbeatOnlyOfficePreview(documentId, tabId)
        .then((result) => {
          if (result?.data?.canEdit === false && editableRef.current) {
            editableRef.current = false;
            setIsEditableState(false);
            setAccessRevoked(true);
            // 先讓使用者看見原因，再重新載入最新權限與文件版本。
            window.setTimeout(() => window.location.reload(), 3000);
          }
        })
        .catch(() => undefined);
    };

    const release = () => {
      if (!acquiredRef.current) return;
      acquiredRef.current = false;
      // pagehide 時 axios 可能被瀏覽器取消，因此另外使用 keepalive。
      sendKeepaliveRequest("office/releaseOnlyOfficePreview", { documentId, tabId });
    };

    const handlePageHide = () => {
      // DocumentEditor 關閉時會由 OnlyOffice 自己完成 status:2 回寫。
      // 此處若再送 force-save，立即重開同一份可編輯文件時會撞上仍在
      // 儲存中的工作階段，造成第二次預覽長時間停在載入畫面。
      release();
    };

    const handleOnline = () => {
      setIsOnline(true);
      if (acquiredRef.current) {
        heartbeat();
        checkpoint();
      }
    };
    const handleOffline = () => setIsOnline(false);

    const leaseStartedAt = performance.now();
    acquireOnlyOfficePreview(documentId, tabId)
      .then((result) => {
        if (disposed) return;
        if (result?.data?.success !== 1) {
          setLeaseError(result?.data?.message || "無法開啟文件預覽");
          return;
        }
        acquiredRef.current = true;
        console.info("[OnlyOffice 預覽] 分頁租約完成", {
          documentId,
          elapsedMs: Math.round(performance.now() - leaseStartedAt),
        });
        setLeaseReady(true);
        heartbeatTimer = window.setInterval(() => {
          heartbeat();
        }, 15000);
        checkpointTimer = window.setInterval(checkpoint, 120000);
      })
      .catch((error) => {
        if (!disposed) {
          setLeaseError(
            error?.response?.data?.message || "無法確認預覽分頁數量，請稍後重試",
          );
        }
      });

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      disposed = true;
      window.clearInterval(heartbeatTimer);
      window.clearInterval(checkpointTimer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("pagehide", handlePageHide);
      if (acquiredRef.current) {
        releaseOnlyOfficePreview(documentId, tabId).catch(() => undefined);
        acquiredRef.current = false;
      }
    };
  }, [documentId]);

  return {
    leaseReady,
    leaseError,
    isOnline,
    isEditable,
    accessRevoked,
    setEditable,
  };
};
