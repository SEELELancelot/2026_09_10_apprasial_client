import React from 'react';
import {render, screen} from '@testing-library/react';
import VersionedAppraisalCheck from './index';

test('shows a valid zero and the explicit validation reason', () => {
  render(<VersionedAppraisalCheck data={{templateVersion: 'v2', blankArray: [{sheet: {
    employeeName: '測試', isManager: false, scores: {
      c6: {name: '工作效率', value: 0}, c7: {name: '品德操守', value: 101, error: '須為 0～100 的數字'},
    },
  }}]}} />);
  expect(screen.getByText('0')).toBeTruthy();
  expect(screen.getByText('（須為 0～100 的數字）')).toBeTruthy();
});
test('rejects malformed API data without crashing the modal', () => {
  render(<VersionedAppraisalCheck data={{templateVersion: 'v2', blankArray: null}} />);
  expect(screen.getByRole('alert').textContent).toContain('檢核回應格式錯誤');
});
