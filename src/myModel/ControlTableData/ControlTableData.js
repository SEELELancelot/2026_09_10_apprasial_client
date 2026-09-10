import TableConstants from '@/myModel/Constants/TableConstants';
import { proxy } from 'valtio';

class ControlTableData {
  defaultAppraisalTableType = TableConstants.employeeAppraisalUsually;

  AppraisalTableType = this.getSavedAppraisalTableType();

  getSavedAppraisalTableType() {
    if (typeof window === 'undefined') return this.defaultAppraisalTableType;

    const savedType = window.localStorage.getItem('appraisalTableType');
    const validTypes = Object.values(TableConstants);

    return validTypes.includes(savedType)
      ? savedType
      : this.defaultAppraisalTableType;
  }

  reset() {
    this.AppraisalTableType = this.defaultAppraisalTableType;

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('appraisalTableType');
    }
  }

  setAppraisalTableType(type) {
    this.AppraisalTableType = type;

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('appraisalTableType', type);
    }
  }
}

export const ControlTableModel = proxy(new ControlTableData());
