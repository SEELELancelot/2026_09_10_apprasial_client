import React from 'react';
import { Alert, Button, Spin } from 'antd';

type Props = {
  loading: boolean;
  message: string;
  onReturn: () => void;
};

export default function ExcelCreationStatus({ loading, message, onReturn }: Props) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 9999, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 640, textAlign: 'center' }}>
        {loading ? (
          <div role="status">
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>{message}</p>
          </div>
        ) : (
          <>
            <Alert type="error" showIcon message="無法開啟新文件" description={message} style={{ textAlign: 'left', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }} />
            <Button onClick={onReturn} style={{ marginTop: 16 }}>返回列表</Button>
          </>
        )}
      </div>
    </div>
  );
}
