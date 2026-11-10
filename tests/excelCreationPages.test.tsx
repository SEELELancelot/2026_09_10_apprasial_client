import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import NormalCreation from '../src/pages/Excel/createAppraisalRecordExcel/createAppraisalRecordExcel';
import AnnualCreation from '../src/pages/Excel/AppraisalYearExcel/createAppraisalYearExcel/createAppraisalYearExcel';
import { createEmployeeAppraisalExcel, createEmployeeYearFinalAppraisalExcel } from '@/networkReuest/Myaxios';
import { history } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  useModel: () => ({ initialState: { user: { USER_ID: 'test-creator' } } }),
  history: { replace: jest.fn(), push: jest.fn() },
}));
jest.mock('@/networkReuest/Myaxios', () => ({
  createEmployeeAppraisalExcel: jest.fn(),
  createEmployeeYearFinalAppraisalExcel: jest.fn(),
}));
jest.mock('@/getInitDropDown/getInitDropDown', () => ({ InitDataFetchMethod: { AllTableData: jest.fn() } }));
jest.mock('@onlyoffice/document-editor-react', () => ({ DocumentEditor: () => { throw new Error('Must not open an editor after creation fails'); } }));
jest.mock('../utils/ScaleTransform', () => ({ ScaleTransform: { apply: jest.fn() } }));

beforeEach(() => { window.name = ''; });
afterEach(() => { cleanup(); jest.clearAllMocks(); window.name = ''; });

describe.each([
  ['平時', NormalCreation, createEmployeeAppraisalExcel],
  ['年度', AnnualCreation, createEmployeeYearFinalAppraisalExcel],
] as const)('%s creation', (_label, Page, request) => {
  it('shows backend failure on the page and returns without creating a second document', async () => {
    (request as jest.Mock).mockResolvedValue({ data: { success: -1, message: '尚未設定考核模板版本' } });
    render(<React.StrictMode><Page /></React.StrictMode>);
    expect(await screen.findByText('尚未設定考核模板版本')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '返回列表' }));
    expect(history.replace).toHaveBeenCalled();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('shows a missing document ID instead of navigating to undefined', async () => {
    (request as jest.Mock).mockResolvedValue({ data: { success: 1, excelName: '考核.xlsx' } });
    render(<Page />);
    expect(await screen.findByText(/後端未回傳完整的文件名稱或文件 ID/)).toBeTruthy();
    expect(history.replace).not.toHaveBeenCalled();
  });

  it('shows the backend HTTP error instead of a white page', async () => {
    (request as jest.Mock).mockRejectedValue({ response: { data: { message: '模板檔案不存在' } } });
    render(<Page />);
    expect(await screen.findByText('模板檔案不存在')).toBeTruthy();
  });
});
