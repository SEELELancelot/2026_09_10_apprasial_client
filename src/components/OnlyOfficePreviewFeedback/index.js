import { Alert, Button, Space, Spin } from "antd";
import { MyUtils } from "@/publicMethod/Utils";

/**
 * 四類考核 Excel 共用的預覽狀態。
 * ONLYOFFICE 有時只在 iframe 內停在「正在載入」而不回傳 component error；
 * 因此各頁統一在逾時後顯示可復原的操作，而非留下一片空白。
 */
const OnlyOfficePreviewFeedback = ({
  loading,
  error,
  title = "Excel 文件",
  fallbackDownload,
}) => (
  <>
    {loading && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#fff",
        }}
      >
        <Spin size="large" />
        <span>正在開啟{title}…</span>
      </div>
    )}
    {error && (
      <div style={{ position: "absolute", inset: 24, zIndex: 3 }}>
        <Alert
          type="error"
          showIcon
          message={`無法開啟${title}`}
          description={error}
          action={
            <Space wrap>
              <Button onClick={() => window.location.reload()}>重新預覽</Button>
              {fallbackDownload?.fileUrl && (
                <Button
                  type="primary"
                  onClick={() =>
                    MyUtils.fileDownload(
                      fallbackDownload.fileUrl,
                      fallbackDownload.fileName || `${title}.xlsx`,
                    )
                  }
                >
                  下載 Excel
                </Button>
              )}
            </Space>
          }
        />
      </div>
    )}
  </>
);

export default OnlyOfficePreviewFeedback;
