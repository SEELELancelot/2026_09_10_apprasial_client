import {getOfficeMode} from '../src/utils/onlyOfficeEditPermission';

it('uses backend permission for main files, and always keeps history read-only', () => {
  expect(getOfficeMode({excelData:{can_edit:true},isHistoryPreview:false})).toBe('edit');
  expect(getOfficeMode({excelData:{can_edit:true},isHistoryPreview:true})).toBe('view');
  expect(getOfficeMode({excelData:{can_edit:false},isHistoryPreview:false,loginUser:{USER_ID:'6868',admin_type:'1'}})).toBe('view');
  for (const excelData of [null, {}, {can_edit:'true'}, {can_edit:1}, {excel_Send:'0',create_userId:'OWNER'}]) {
    expect(getOfficeMode({excelData,isHistoryPreview:false})).toBe('view');
  }
});
