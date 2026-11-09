import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { DocumentEditor } from '@onlyoffice/document-editor-react';
import OnlyOfficeEditorHost from './index';

const OnlyOfficePreviewFeedback = require('../OnlyOfficePreviewFeedback').default as (props: {
  loading: boolean;
  error: string;
  title: string;
}) => JSX.Element;

jest.mock('@/publicMethod/Utils', () => ({
  MyUtils: { fileDownload: jest.fn() },
}));

interface EditorInstance {
  destroyEditor(): void;
}

const editorWindow = window as unknown as {
  DocsAPI?: { DocEditor: (id: string) => EditorInstance };
  DocEditor?: { instances: Record<string, EditorInstance | undefined> };
};

beforeEach(() => {
  editorWindow.DocEditor = { instances: {} };
  editorWindow.DocsAPI = {
    // Use the real React wrapper, with the same DOM replacement as DocsAPI.
    DocEditor(id: string) {
      const placeholder = document.getElementById(id);
      if (!placeholder?.parentNode) throw new Error('Missing editor placeholder');
      const iframe = document.createElement('iframe');
      iframe.title = 'ONLYOFFICE regression fixture';
      placeholder.parentNode.replaceChild(iframe, placeholder);
      return {
        destroyEditor() {
          const restoredPlaceholder = document.createElement('div');
          restoredPlaceholder.id = id;
          iframe.parentNode?.replaceChild(restoredPlaceholder, iframe);
        },
      };
    },
  };
});

afterEach(() => {
  cleanup();
  delete editorWindow.DocsAPI;
  delete editorWindow.DocEditor;
});

function Preview({ loading, error = '' }: { loading: boolean; error?: string }) {
  return (
    <div>
      <OnlyOfficePreviewFeedback loading={loading} error={error} title="年度考核表" />
      <OnlyOfficeEditorHost>
        <DocumentEditor
          id="regression-editor"
          documentServerUrl="http://document-server.invalid"
          config={{
            document: {
              fileType: 'xlsx',
              key: 'regression',
              title: 'Regression fixture.xlsx',
              url: 'http://files.invalid/test.xlsx',
            },
          }}
        />
      </OnlyOfficeEditorHost>
    </div>
  );
}

it.each(['error', 'loading'] as const)(
  'keeps the editor mounted when %s feedback appears after document loading',
  async (transition) => {
    const { container, rerender, unmount } = render(<Preview loading />);
    await waitFor(() => expect(container.querySelector('iframe')).not.toBeNull());
    const iframe = container.querySelector('iframe');

    rerender(<Preview loading={false} />);
    expect(container.textContent).not.toContain('正在開啟');

    if (transition === 'error') {
      rerender(<Preview loading={false} error="文件讀取失敗，請重試" />);
      expect(container.textContent).toContain('文件讀取失敗，請重試');
    } else {
      rerender(<Preview loading />);
      expect(container.textContent).toContain('正在開啟年度考核表');
    }

    expect(container.querySelector('iframe')).toBe(iframe);
    expect(() => unmount()).not.toThrow();
  },
);
