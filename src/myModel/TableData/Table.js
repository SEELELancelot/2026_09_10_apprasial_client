import { proxy } from "valtio";
import {
  getAppraisalTable,
  getYearAppraisalTableFetch,
  getBonusExcelTable, // 端午
  getBonusAutTable,   // 中秋
} from "@/networkReuest/Myaxios";

/**
 * ✅ 獎金調查 API 映射表
 */
const holidayApiMap = {
  dragon: getBonusExcelTable,
  midAutumn: getBonusAutTable,
};

/**
 * ✅ 統一解析查詢參數
 *
 * 支援兩種寫法：
 *
 * TableModel.setAppraisalTable("115")
 *
 * TableModel.setAppraisalTable({
 *   year: "115",
 *   statusMode: "all",
 * })
 */
const normalizeQueryOptions = (input, defaultStatusMode = "all") => {
  if (typeof input === "object" && input !== null) {
    return {
      year: input.year ?? "",
      statusMode: input.statusMode ?? defaultStatusMode,
    };
  }

  return {
    year: input ?? "",
    statusMode: defaultStatusMode,
  };
};

class Table {
  ExcelAddPasswordName = "";

  /**
   * ✅ 平時考核
   */
  AppraisalTable = {
    isLoading: false,
    data: [],
  };
  currentAppraisalYear = "";
  appraisalRequestId = 0;
  /**
   * ✅ 年度考核
   */
  AppraisalYearTable = {
    isLoading: false,
    data: [],
  };

  currentAppraisalYearFinalYear = "";
  appraisalYearRequestId = 0;
  /**
   * ✅ 獎金調查
   */
  currentHoliday = "dragon";

  holidayTable = {
    isLoading: false,
    data: [],
  };

  holidayRequestId = 0;

  reset() {
    this.ExcelAddPasswordName = "";

    this.AppraisalTable = {
      isLoading: false,
      data: [],
    };

    this.currentAppraisalYear = "";
    this.appraisalRequestId = 0;

    this.AppraisalYearTable = {
      isLoading: false,
      data: [],
    };

    this.currentAppraisalYearFinalYear = "";
    this.appraisalYearRequestId = 0;

    this.currentHoliday = "dragon";

    this.holidayTable = {
      isLoading: false,
      data: [],
    };

    this.holidayRequestId = 0;
  }

  /**
   * ✅ 平時考核列表
   *
   * year:
   * - "115"
   * - "ALL"
   *
   * statusMode:
   * - mine：我建立、尚未送出的資料
   * - pendingMine：待我簽核
   * - all：全部資料，主管/管理者用
   *
   * 可用寫法：
   * TableModel.setAppraisalTable("115")
   *
   * TableModel.setAppraisalTable({
   *   year: "115",
   *   statusMode: "all",
   * })
   */
  async setAppraisalTable(options = "") {
    const { year, statusMode } = normalizeQueryOptions(options, "all");

    const requestId = ++this.appraisalRequestId;

    this.currentAppraisalYear = year;

    this.AppraisalTable = {
      isLoading: true,
      data: [],
    };

    try {
      const result = await getAppraisalTable({
        year,
        statusMode,
      });

      if (requestId !== this.appraisalRequestId) return;

      const { success, message } = result.data;

      this.AppraisalTable = {
        isLoading: false,
        data: success === 1 ? message : [],
      };
    } catch (e) {
      console.error("❌ setAppraisalTable failed", e);

      if (requestId !== this.appraisalRequestId) return;

      this.AppraisalTable = {
        isLoading: false,
        data: [],
      };
    }
  }

  /**
   * ✅ 年度考核列表
   *
   * 先預留跟平時考核一樣的 statusMode。
   * 之後年度考核要接簽核流程時，可以直接共用。
   */
  async setAppraisalYearTable(options = "") {
    const { year, statusMode } = normalizeQueryOptions(options, "all");

    const requestId = ++this.appraisalYearRequestId;

    this.currentAppraisalYearFinalYear = year;

    this.AppraisalYearTable = {
      isLoading: true,
      data: [],
    };

    try {
      const result = await getYearAppraisalTableFetch({
        year,
        statusMode,
      });

      if (requestId !== this.appraisalYearRequestId) return;

      const { success, message } = result.data;

      this.AppraisalYearTable = {
        isLoading: false,
        data: success === 1 ? message : [],
      };
    } catch (e) {
      console.error("❌ setAppraisalYearTable failed", e);

      if (requestId !== this.appraisalYearRequestId) return;

      this.AppraisalYearTable = {
        isLoading: false,
        data: [],
      };
    }
  }

  /**
   * ✅ 獎金調查列表
   *
   * holidayType:
   * - dragon
   * - midAutumn
   *
   * statusMode:
   * - mine：我建立、尚未送出的資料
   * - pendingMine：待我簽核
   * - all：全部資料，主管/管理者用
   */
  async setHolidayTable(holidayType, year = "", statusMode = "all") {
    const requestId = ++this.holidayRequestId;

    this.currentHoliday = holidayType;

    this.holidayTable = {
      isLoading: true,
      data: [],
    };

    const apiFn = holidayApiMap[holidayType];

    if (!apiFn) {
      this.holidayTable = {
        isLoading: false,
        data: [],
      };
      return;
    }

    try {
      const result = await apiFn({
        year,
        statusMode,
      });

      if (requestId !== this.holidayRequestId) return;

      const { success, message } = result.data;

      this.holidayTable = {
        isLoading: false,
        data: success === 1 ? message : [],
      };
    } catch (e) {
      console.error("❌ setHolidayTable failed", e);

      if (requestId !== this.holidayRequestId) return;

      this.holidayTable = {
        isLoading: false,
        data: [],
      };
    }
  }

  /**
   * ✅ 只看待我簽核：平時考核
   */
  async setPendingMineAppraisalTable(year = "") {
    await this.setAppraisalTable({
      year,
      statusMode: "pendingMine",
    });
  }

  /**
   * ✅ 只看待我簽核：年度考核
   */
  async setPendingMineAppraisalYearTable(year = "") {
    await this.setAppraisalYearTable({
      year,
      statusMode: "pendingMine",
    });
  }

  /**
   * ✅ 只看待我簽核：獎金調查
   */
  async setPendingMineHolidayTable(holidayType, year = "") {
    await this.setHolidayTable(holidayType, year, "pendingMine");
  }
}

export const TableModel = proxy(new Table());
