import { proxy } from 'valtio';
import { getDropDownYear } from '@/networkReuest/Myaxios';

class DropDown {
  dropDownYear = { isLoading: false, data: [] };

  selectedYearMap = this.getSavedMap('appraisalSelectedYearMap');
  selectedFestivalMap = this.getSavedMap('appraisalSelectedFestivalMap');

  getSavedMap(storageKey) {
    if (typeof window === 'undefined') return {};

    try {
      return JSON.parse(window.localStorage.getItem(storageKey) || '{}');
    } catch (e) {
      return {};
    }
  }

  saveMap(storageKey, value) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    }
  }

  reset() {
    this.dropDownYear = { isLoading: false, data: [] };
    this.selectedYearMap = {};
    this.selectedFestivalMap = {};

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('appraisalSelectedYearMap');
      window.localStorage.removeItem('appraisalSelectedFestivalMap');
    }
  }

  // ---------------- 年度 ----------------
  async setDropDownYear() {
    this.dropDownYear.isLoading = true;
    const result = await getDropDownYear();
    const { success, data } = result.data;

    if (success === 1) {
      this.dropDownYear = { isLoading: false, data };
    } else {
      this.dropDownYear = { isLoading: false, data: [] };
    }
  }

  getSelectedYear(type) {
    const current = this.selectedYearMap[type];
    if (current) return current;

    const currentYear = (new Date().getFullYear() - 1911).toString();
    const found = this.dropDownYear.data.find(item => item.value === currentYear);
    return found ? found.value : (this.dropDownYear.data[0]?.value ?? undefined);
  }

  setSelectedYear(type, value) {
    this.selectedYearMap[type] = value;
    this.saveMap('appraisalSelectedYearMap', this.selectedYearMap);
  }

  // ---------------- 節日 ----------------
  // ✅ 預設節日是「端午」
  getSelectedFestival(type) {
    return this.selectedFestivalMap[type] ?? 'dragon';
  }

  setSelectedFestival(type, value) {
    this.selectedFestivalMap[type] = value;
    this.saveMap('appraisalSelectedFestivalMap', this.selectedFestivalMap);
  }
}

export const DropDownModel = proxy(new DropDown());
