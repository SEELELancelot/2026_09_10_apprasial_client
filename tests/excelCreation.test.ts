import { getExcelCreationError, readExcelCreationResponse } from '../src/utils/excelCreation';

it('accepts a complete created document and preserves its ID', () => {
  expect(readExcelCreationResponse({ success: 1, excelId: 'document-1', excelName: '考核.xlsx' }))
    .toEqual({ success: 1, excelId: 'document-1', excelName: '考核.xlsx' });
});

it('keeps the backend failure message visible', () => {
  try {
    readExcelCreationResponse({ success: -1, message: '尚未設定考核模板版本' });
    throw new Error('Expected validation failure');
  } catch (error) {
    expect(getExcelCreationError(error, 'fallback')).toBe('尚未設定考核模板版本');
  }
});

it.each([
  { success: 1, excelName: '考核.xlsx' },
  { success: 1, excelId: 'document-1' },
  { success: 1, excelId: ' ', excelName: '考核.xlsx' },
])('rejects incomplete success responses before navigation: %j', (input) => {
  expect(() => readExcelCreationResponse(input)).toThrow('後端未回傳完整');
});

it('shows HTTP errors and explains that a timed out creation may still have completed', () => {
  expect(getExcelCreationError({ response: { data: { message: '模板檔案不存在' } } }, 'fallback'))
    .toBe('模板檔案不存在');
  expect(getExcelCreationError({ code: 'ECONNABORTED' }, 'fallback')).toContain('確認文件是否已建立');
  expect(getExcelCreationError({ response: { data: '<html>server failure</html>' } }, 'fallback')).toBe('fallback');
});
