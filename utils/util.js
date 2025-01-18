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

  // 格式化 fxTime 为 hh:mm
  const formatHourTime = (time) => {
    const date = new Date(time);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  var qqmapsdk;
  const qqmapKey = 'XHPBZ-S7CWW-VYQRA-YJIOI-QDZOT-EAFJL'
  var QQMapWX = require('../utils/libs/qqmap/qqmap-wx-jssdk.js');

// 经纬度逆解析地址
  const fetchAddress = (lon, lat,successCallback, errorCallback) => {
    if (!qqmapsdk) {
      qqmapsdk = new QQMapWX({
        key: qqmapKey
      });
    }
    qqmapsdk.reverseGeocoder({
      location: {
        latitude: lat,
        longitude: lon
      },
      success: function (res1) {
        const address = res1.result.address_component
        let addressDetail = ''
        if (address.city && address.district) {
          addressDetail = address.street ? `${address.city} ${address.district} ${address.street}` : `${address.city} ${address.district}`
        } else {
          addressDetail = '这是哪里？'
        }
        successCallback(addressDetail);

        // that.setData({
        //   address: addressDetail,
        // })
        // wx.setStorage({
        //   key: 'locationData',
        //   data: {
        //     address: addressDetail,
        //     latitude: lat,
        //     longitude: lon
        //   }
        // });

      },
      fail: function (error) {

        errorCallback(`请求失败：${error.errMsg}`);
        // wx.hideLoading();
        // that.setData({
        //   "isLoading": false,
        // })
        // wx.showToast({
        //   title: '地址解析失败',
        //   icon: 'none',
        // })
      }
    })
  }

module.exports = {
  formatTime,
  getCurrentDate,
  getCurrentDateLong,
  formatWeekDate,
  formatHourTime,
  fetchAddress
}
