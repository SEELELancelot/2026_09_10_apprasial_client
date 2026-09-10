import { proxy } from 'valtio';
class HolidayTableBonusStoreClass {
  bonusType = '中秋節';   // 當前選擇的節日類型
  tableData: any[] = [];  // 表格資料
  loading = false;        // 載入狀態

  setBonusType(type: string) {
    this.bonusType = type;
  }
  setTableData(data: any[]) {
    this.tableData = data;
  }
  setLoading(status: boolean) {
    this.loading = status;
  }

  async fetchTableData(type: string) {
    this.setLoading(true);
    this.setBonusType(type);
    const fakeData = await new Promise<any[]>((resolve) => {
      setTimeout(() => {
        resolve([
          {
            excel_id: `${type}-001`,
            excel_Name: `${type}獎金調查表`,
            create_time: new Date().toISOString(),
            excel_Send: '0',
            bonus_type: type,
          },
        ]);
      }, 500);
    });
    this.setTableData(fakeData);
    this.setLoading(false);
  }
}

// ✅ 用 proxy 包起來才能被 Valtio 追蹤
const HolidayTableBonusStore = proxy(new HolidayTableBonusStoreClass());
export default HolidayTableBonusStore;

