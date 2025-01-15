// pages/sun/sun.js

const charge_weather_key = '85df4159ecb14556bd88696334386822'
const util = require('../../utils/util.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    address: "",
    latitude: 0,
    longitude: 0,
    selectedDate: '',
    showSelectedDate: '',
    sunrise: '',
    sunset: '',
    tabData: [], // 存储近十天的数据
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

    this.generateTabData()

    const that = this
    wx.getStorage({
      key: 'locationData',
      success(res) {
        console.log('页面A的数据:', res.data);
        that.setData({
          address: res.data.address,
          latitude: res.data.latitude,
          longitude: res.data.longitude,
        })
        that.getSunData(that.data.selectedDate, res.data.longitude, res.data.latitude)
      }
    });
  },

  // 生成今天及以后的十天的数据
  generateTabData: function () {
    let tabData = [];
    let today = new Date();
    let currentDate = new Date(today); // 当前日期

    const selectDate = this.formatDate(currentDate)
    const showDate = selectDate.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');

    // 默认选中今天
    this.setData({
      selectedDate: selectDate,
      showSelectedDate: showDate
    });

    // 生成今天及以后的 10 天
    for (let i = 0; i < 30; i++) {
      let date = new Date(currentDate);
      date.setDate(currentDate.getDate() + i); // 根据偏移量计算日期
      let dateString = this.formatDate(date);
      let week = this.getWeekday(date);

      tabData.push({
        date: dateString,
        showStr: this.formatShowStr(date),
        week: week,
        isToday: dateString === this.formatDate(today) ? 1 : 0,
        isSelected: dateString === this.formatDate(today) ? 1 : 0 // 默认选中今天
      });
    }

    console.log('近十日日期 ', tabData)

    this.setData({
      tabData: tabData
    });
  },

  // 格式化日期为 'YYYYMMDD' 格式
  formatDate: function (date) {
    let year = date.getFullYear();
    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
    let dayStr = `${year}${month}${day}`;
    return dayStr;
  },

  // 格式化日期为 'MM/DD' 格式
  formatShowStr: function (date) {
    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
  },

  // 获取星期几
  getWeekday: function (date) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
  },

  // 切换日期
  switchDate: function (event) {
    let selectedDate = event.currentTarget.dataset.date;
    const showDate = selectedDate.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');

    this.setData({
      selectedDate: selectedDate,
      showSelectedDate: showDate
    });
    // 更新选中的日期的状态
    let tabData = this.data.tabData.map(item => {
      item.isSelected = item.date === selectedDate ? 1 : 0;
      return item;
    });

    this.setData({
      tabData: tabData
    });

    this.getSunData(this.data.selectedDate, this.data.longitude, this.data.latitude)

  },

  selectLocation() {
    const that = this
    console.log('选择定位')
    wx.chooseLocation({
      success: function (res) {
        console.log('选择坐标', res);
        //  wx.showLoading({
        //   title: '获取中...', // 提示的内容
        //   mask: true // 是否显示透明蒙层，防止触摸穿透，默认为 false
        // });
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          address: res?.address || '这是哪里？',
        })
        that.getSunData(that.data.selectedDate, res.longitude, res.latitude)
      },
      fail: function () {},
      complete: function () {}
    })
  },

  // 获取日出日落数据
  getSunData(date, lon, lat) {

    // 请求接口的URL
    const url = 'https://api.qweather.com/v7/astronomy/sun'
    // 请求参数
    const params = {
      key: charge_weather_key,
      date,
      location: `${lon},${lat}`,
      // location: `119.433786,39.797511`,
    }

    const that = this
    wx.request({
      url: url, // 请求的接口地址
      method: 'GET', // 请求方法
      data: params, // 请求的参数
      success: function (res) { // 请求成功之后的回调函数
        console.log('日出data ', res)
        const code = res.data.code

        if (code == 403) {
          wx.showToast({
            title: 'Run out of money',
            icon: 'none',
          })
        }

        const sunriseData = res.data.sunrise
        if (sunriseData && sunriseData.length > 0) {
          const formatSunrise = util.formatHourTime(sunriseData)
          const formatSunset = util.formatHourTime(res.data.sunset)

          that.setData({
            sunrise: formatSunrise,
            sunset: formatSunset
          })
        } else {
          that.setData({
            sunrise: '',
            sunset: ''
          })
          wx.showToast({
            title: '未查询到数据',
            icon: 'none',
          })
        }
        wx.hideLoading();

      },
      fail: function (res) {
        console.log('获取数据失败: ', res)
        wx.showToast({
          title: '未查询到数据',
          icon: 'none',
        })
      }
    })

  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})