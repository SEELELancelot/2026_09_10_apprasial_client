import React, { type ReactNode } from 'react';

interface OnlyOfficeEditorHostProps {
  children: ReactNode;
}

export default function OnlyOfficeEditorHost({ children }: OnlyOfficeEditorHostProps) {
  // DocsAPI replaces its placeholder with an iframe. Keep that replacement
  // inside a stable node so React can update adjacent loading/error feedback.
  return <div style={{ width: '100%', height: '100%' }}>{children}</div>;
}
