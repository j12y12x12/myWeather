const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

const getCurrentDate = () =>{
  const date = new Date(); // 获取当前日期
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); 
  const day = String(date.getDate()).padStart(2, '0'); 
  // 返回格式化后的日期字符串
  return `${year}${month}${day}`;
}
const getCurrentDateLong = () =>{
  const date = new Date(); // 获取当前日期
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); 
  const day = String(date.getDate()).padStart(2, '0'); 
  // 返回格式化后的日期字符串
  return `${year}年${month}月${day}日`;
}

const formatWeekDate = (dateStr) => {
  // 将 20241218 解析为日期对象
  const year = dateStr.slice(0, 4);
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  
  const date = new Date(`${year}-${month}-${day}`);

  // 获取星期几
  const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const weekDay = weekDays[date.getDay()];

  // 格式化日期为 'YYYY年MM月DD日 星期X'
  const formattedDate = `${year}年${month}月${day}日 ${weekDay}`;

  return formattedDate;
}

module.exports = {
  formatTime,
  getCurrentDate,
  getCurrentDateLong,
  formatWeekDate
}
