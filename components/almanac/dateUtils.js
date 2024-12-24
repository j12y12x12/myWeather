// dateUtils.js

function getDaysAfterWinterSolstice(date, winterSolstice) {
  const diffTime = new Date(date) - new Date(winterSolstice);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // 使得冬至当天算作第1天
}

// 通用的几九计算函数
function getJiuNameByDiffDays(diffDays) {
  if (diffDays >= 0 && diffDays < 9) return "一九";
  if (diffDays >= 9 && diffDays < 18) return "二九";
  if (diffDays >= 18 && diffDays < 27) return "三九";
  if (diffDays >= 27 && diffDays < 36) return "四九";
  if (diffDays >= 36 && diffDays < 45) return "五九";
  if (diffDays >= 45 && diffDays < 54) return "六九";
  if (diffDays >= 54 && diffDays < 63) return "七九";
  if (diffDays >= 63 && diffDays < 72) return "八九";
  if (diffDays >= 72 && diffDays < 81) return "九九";
  return "";
}

function getWinterSolsticeNine(date) {
  const winterSolstice2024 = new Date('2024-12-21');
  const winterSolstice2025 = new Date('2025-12-21');

  // 计算当前日期到冬至后的天数
  const daysAfterWinterSolstice2024 = getDaysAfterWinterSolstice(date, winterSolstice2024);
  const daysAfterWinterSolstice2025 = getDaysAfterWinterSolstice(date, winterSolstice2025);
  // console.log('是2024冬至后的第几天 ',daysAfterWinterSolstice2024)
  // console.log('是2025冬至后的第几天 ',daysAfterWinterSolstice2025)

  if (daysAfterWinterSolstice2024 >= 0 && daysAfterWinterSolstice2024 < 81) {
    return getJiuNameByDiffDays(daysAfterWinterSolstice2024);
  }

  if (daysAfterWinterSolstice2025 >= 0 && daysAfterWinterSolstice2025 < 81) {
    return getJiuNameByDiffDays(daysAfterWinterSolstice2025);
  }
  return "";
}

module.exports = { getWinterSolsticeNine };
