import { DisableExcelModel } from '@/myModel/DisableExcel/DisableExcel';
import { DropDownModel } from '@/myModel/DropDown/dropDown';
import { TableModel } from '@/myModel/TableData/Table';
import { DateUtils } from '../../utils/DateUtils';

class InitDataFetch {
  AllDropDownInit() {}

  setAppraisalTableFetch = () => {
    TableModel.setAppraisalTable({
      year: DropDownModel.getSelectedYear('normal'),
      statusMode: 'all',
    });
  };
  // 設置年末考核
  setYearAppraisalTableFetch = () => {
    TableModel.setAppraisalYearTable({
      year: DropDownModel.getSelectedYear('annual'),
      statusMode: 'all',
    });
  };
  // 先設置今年 端午表
  setHolidayTable = () => {
    TableModel.setHolidayTable(
      DropDownModel.getSelectedFestival('bonus'),
      DropDownModel.getSelectedYear('bonus') || DateUtils.getCurrentTaiwanYear(),
      'all',
    );
  };
  setDropDownYear = async () => {
    await DropDownModel.setDropDownYear();
    DisableExcelModel.setDisableExcel();
  };

  async AllDropDownDownData() {
    await this.setDropDownYear();
  }
  async AllTableData() {
    this.setAppraisalTableFetch();
    this.setYearAppraisalTableFetch();
    this.setHolidayTable();
  }
}

export const InitDataFetchMethod = new InitDataFetch();
