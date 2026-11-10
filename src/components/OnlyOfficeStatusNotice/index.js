import { useEffect, useState } from "react";
import { Alert } from "antd";

const containerStyle = {
  position: "fixed",
  top: 10,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 20,
  maxWidth: "calc(100vw - 32px)",
  pointerEvents: "none",
};

const OnlyOfficeStatusNotice = ({
  leaseError,
  isOnline,
  isEditable,
  accessRevoked,
}) => {
  const [showReadOnlyNotice, setShowReadOnlyNotice] = useState(false);

  useEffect(() => {
    if (isEditable !== false) {
      setShowReadOnlyNotice(false);
      return undefined;
    }

    setShowReadOnlyNotice(true);
    const timer = window.setTimeout(() => setShowReadOnlyNotice(false), 5000);
    return () => window.clearTimeout(timer);
  }, [isEditable]);

  if (leaseError) {
    return (
      <div style={{ ...containerStyle, pointerEvents: "auto" }}>
        <Alert type="warning" showIcon message={leaseError} />
      </div>
    );
  }

  if (accessRevoked) {
    return (
      <div style={{ ...containerStyle, pointerEvents: "auto" }}>
        <Alert
          type="warning"
          showIcon
          message="文件狀態或權限已變更（可能已送出或刪除），此分頁無法再儲存；即將重新載入，請返回清單確認。"
        />
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div style={containerStyle}>
        <Alert
          type="error"
          showIcon
          message="網路已中斷，請先不要關閉分頁；恢復連線後會再次進行安全存檔。"
        />
      </div>
    );
  }

  if (isEditable === false && showReadOnlyNotice) {
    return (
      <div style={containerStyle}>
        <Alert
          type="info"
          showIcon
          message="此文件目前為唯讀預覽，無法修改或儲存。"
        />
      </div>
    );
  }

  return null;
};

export default OnlyOfficeStatusNotice;
