class DateUtils {
    /**
     * 直接取得今年的民國年
     */
    static getCurrentTaiwanYear() {
        const year = new Date().getFullYear(); // 例如 2025
        return year - 1911;                    // 轉成民國年 → 114
    }
}

module.exports={DateUtils};
