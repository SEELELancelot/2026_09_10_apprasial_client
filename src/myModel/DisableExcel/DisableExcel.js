import { getDisableExcel } from '@/networkReuest/Myaxios';
import { proxy } from 'valtio';

class DisableExcel {
  disableExcel = { isLoading: false, data: [] };

  reset() {
    this.disableExcel = { isLoading: false, data: [] };
  }

  // 取得 bonus_type 資料
  async setDisableExcel() {
    this.disableExcel.isLoading = true;

    const result = await getDisableExcel();
    const { success, data } = result.data;

    if (success === 1) {
      this.disableExcel = { isLoading: false, data };
    } else {
      this.disableExcel = { isLoading: false, data: [] };
    }
  }

  // ⭐ 通用 disable 檢查
  isDisabled(id) {
    if (this.disableExcel.isLoading) return true;
    const found = this.disableExcel.data.find((item) => item.id === id);
    return found?.disable === 1;
  }
}

export const DisableExcelModel = proxy(new DisableExcel());
