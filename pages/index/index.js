// index.js
const chooseLocation = requirePlugin('chooseLocation');
const util = require('../../utils/util.js')
import * as echarts from '../../ec-canvas/echarts.min';

let chart = null;
// 免费key
const free_weather_key = '46dc1503ca4b4b189c88ac475ce69b1f'
// 付费key
const charge_weather_key = '85df4159ecb14556bd88696334386822'


const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

const weeks = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

Page({
  data: {
    location: {
      latitude: 0,
      longitude: 0,
    },
    selectedTab: 0,
    address: '',
    isLoading: true,
    isChangeLocation: false,
    dayWeather: {},
    sevenDayWeathers: [],
    thirtyDayWeathers: [],
    hourWeather: {},
    dayImage: '',
    echartsComponnet: null,
    ec: {
      lazyLoad: true // 延迟加载
    },
    currentDay: ''
    // hasUserInfo: false,
    // canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    // canIUseNicknameComp: wx.canIUse('input.type.nickname'),
  },
  // 分享给朋友
  onShareAppMessage() {

  },
  // 分享到朋友圈
  onShareTimeline() {

  },
  // onShow: function() {
  //   // 页面显示时触发的操作

  //   console.log('选择器  ',chooseLocation);
  //   // const location = chooseLocation.getLocation(); 
  //   // console.log('选择的地点  ',location);
  // },
  onLoad: function () {
    this.setData({
      "isLoading": true,
    })
    this.getUserLocation()
    const currentDay = util.getCurrentDate()
    this.setData({
      currentDay
    })
  },

  selectTab(event) {
    var tabId = event.currentTarget.dataset.tabId;
    console.log('选择tab改变  ', tabId)
    this.setData({
      selectedTab: tabId,
    })
    if (tabId == 1 && (this.data.isChangeLocation || this.data.thirtyDayWeathers.length == 0)) {
      // 30日天气
      let long = this.data.location.longitude;
      let lat = this.data.location.latitude;
      console.log('保存的位置: ', this.data.location)
      // console.log( '保存的位置lat: ',lat)
      this.fetchThirtyDayWeather(long, lat)
    }
  },
  // 获取位置信息
  getUserLocation() {

    const that = this
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true, // 开启高精度
      success(res) {
        const latitude = res.latitude
        const longitude = res.longitude
        console.log('位置信息  ', res);
        that.setData({
          "location.latitude": res.latitude,
          "location.longitude": res.longitude,
        })
        // that.location.latitude = latitude
        // that.location.longitude = longitude
        that.fetchAddress(longitude, latitude)
        that.fetchAllWeatherInfo(longitude, latitude)
      },
      fail(res) {
        wx.hideLoading();
        that.setData({
          "isLoading": false,
        })
        console.log('位置信息失败  ', res);
      }
    })
  },
  selectLocation() {
    const that = this
    console.log('选择定位')
    wx.chooseLocation({
      success: function (res) {
        console.log('选择坐标', res);
        wx.showLoading({
          title: '获取中...', // 提示的内容
          mask: true // 是否显示透明蒙层，防止触摸穿透，默认为 false
        });
        that.setData({
          "location.latitude": res.latitude,
          "location.longitude": res.longitude,
          isLoading: true,
          dayWeather: {},
          sevenDayWeathers: [],
          thirtyDayWeathers: [],
          hourWeather: {},
          dayImage: '',
          address: res?.address || '这是哪里？',
          isChangeLocation: true,
          selectedTab: 0
        })
        wx.setStorage({
          key: 'locationData',
          data: {
            address: res?.address || '这是哪里？',
            latitude: res.latitude,
            longitude: res.longitude
          }
        });
        that.fetchAllWeatherInfo(res.longitude, res.latitude)
      },
      fail: function () {},
      complete: function () {}
    })
  },
  fetchAllWeatherInfo(lon, lat) {
    this.setData({
      selectedTab: 0,
    })
    this.fetchDayWeather(lon, lat)
    this.fetchMinuteWeather(lon, lat)
    this.fetch7DayWeather(lon, lat)
  },
  fetchAddress(lon, lat) {
    const that = this
    util.fetchAddress(lon, lat,
      function (data) {
        // 成功回调，打印返回数据
        that.setData({
          address: data,
        })
        wx.setStorage({
          key: 'locationData',
          data: {
            address: data,
            latitude: lat,
            longitude: lon
          }
        });
        wx.hideLoading();
        that.setData({
          "isLoading": false,
        })
      },
      function (errorMessage) {
        // 错误回调，打印错误信息
        console.error('请求失败:', errorMessage);
        wx.hideLoading();
        that.setData({
          "isLoading": false,
        })
        wx.showToast({
          title: '地址解析失败',
          icon: 'none',
        })
      });
  },
  // 近两小时天气
  fetchMinuteWeather(lon, lat) {
    if (!lon || !lat) {
      return
    }
    const that = this
    wx.request({
      url: 'https://devapi.qweather.com/v7/minutely/5m',
      method: 'GET', //请求的方式
      data: { //发送到服务器的数据
        location: `${lon},${lat}`,
        key: free_weather_key
      },
      success: function (res) { // 请求成功之后的回调函数
        that.setData({
          "hourWeather": res.data,
        })
        console.log('近两小时天气 ', that.data.hourWeather)
        that.showEcharts()
      },
      fail: function (res) {
        wx.showToast({
          title: '获取小时天气失败',
          icon: 'none',
        })
      }
    })
  },
  // 当日天气
  fetchDayWeather(lon, lat) {
    if (!lon || !lat) {
      console.log('经纬度为空');
      return
    }
    const that = this
    wx.request({
      url: 'https://devapi.qweather.com/v7/weather/now',
      method: 'GET', //请求的方式
      data: { //发送到服务器的数据
        location: `${lon},${lat}`,
        key: free_weather_key
      },
      success: function (res) { // 请求成功之后的回调函数
        console.log('实时天气 ', res)
        const now = res.data.now
        const imageCode = now.icon
        const imageUrl = `../../assets/icon_weather/${imageCode}.png`
        that.setData({
          "dayWeather": now,
          "dayImage": imageUrl
        })
      },
      fail: function (res) {

        wx.showToast({
          title: '获取实时天气失败',
          icon: 'none',
        })
      }
    })
  },
  // 7日天气
  fetch7DayWeather(lon, lat) {
    if (!lon || !lat) {
      return
    }
    const that = this
    wx.request({
      url: 'https://devapi.qweather.com/v7/weather/7d',
      method: 'GET', //请求的方式
      data: { //发送到服务器的数据
        location: `${lon},${lat}`,
        key: free_weather_key
      },
      success: function (res) { // 请求成功之后的回调函数
        console.log('7日天气 ', res)
        const sevenDays = res.data.daily
        if (sevenDays) {
          sevenDays.forEach(function (obj) {
            const dayCode = obj.iconDay
            const nightCode = obj.iconNight
            obj.iconDayUrl = `../../assets/icon_weather/${dayCode}.png`;
            obj.iconNightUrl = `../../assets/icon_weather/${nightCode}.png`;
            obj.isToday = isToday(obj.fxDate)
            var date = new Date(obj.fxDate);
            var dayOfWeek = date.getDay();
            const onlyDate = obj.fxDate.substring(5)
            var modifiedDate = onlyDate.replace("-", "/");
            obj.showDate = modifiedDate
            obj.weekStr = weeks[dayOfWeek]
          });
        }
        wx.hideLoading();
        that.setData({
          "sevenDayWeathers": sevenDays,
          isLoading: false
        })
      },
      fail: function (res) {
        wx.hideLoading();
        that.setData({
          isLoading: false
        })
        wx.showToast({
          title: '获取近日天气失败',
          icon: 'none',
        })
      }
    })
  },
  // 30日天气
  fetchThirtyDayWeather(lon, lat) {
    if (!lon || !lat) {
      return
    }
    const that = this
    wx.request({
      url: 'https://api.qweather.com/v7/weather/30d',
      method: 'GET', //请求的方式
      data: { //发送到服务器的数据
        location: `${lon},${lat}`,
        key: charge_weather_key
      },
      success: function (res) { // 请求成功之后的回调函数
        console.log('30日天气 ', res)
        const code = res.data.code
        console.log('30日天气code ', code)

        if (code == 403) {
          wx.hideLoading();
          that.setData({
            isLoading: false
          })
          wx.showToast({
            title: 'Run out of money',
            icon: 'none',
          })
        }
        const thirtyDays = res.data.daily
        if (thirtyDays) {
          thirtyDays.forEach(function (obj) {
            const dayCode = obj.iconDay
            const nightCode = obj.iconNight
            obj.iconDayUrl = `../../assets/icon_weather/${dayCode}.png`;
            obj.iconNightUrl = `../../assets/icon_weather/${nightCode}.png`;
            obj.isToday = isToday(obj.fxDate)
            var date = new Date(obj.fxDate);
            var dayOfWeek = date.getDay();
            const onlyDate = obj.fxDate.substring(5)
            var modifiedDate = onlyDate.replace("-", "/");
            obj.showDate = modifiedDate
            obj.weekStr = weeks[dayOfWeek]
          });
        }
        wx.hideLoading();
        that.setData({
          "thirtyDayWeathers": thirtyDays,
          isLoading: false,
          isChangeLocation: false
        })
      },
      fail: function (res) {
        console.log('获取30日天气失败: ', res)
        wx.hideLoading();
        that.setData({
          isLoading: false
        })
        wx.showToast({
          title: '获取近日天气失败',
          icon: 'none',
        })
      }
    })
  },

  /**
   * 获取图表数据
   */
  getData(type) {
    this[type].init((canvas, width, height, dpr) => {
      chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr
      });
      chart.setOption(this.getOption());
      return chart;
    });
  },
  /**
   * 图表init
   */
  getOption(e) {
    const hourWeather = this.data.hourWeather
    const minutely = hourWeather.minutely
    const precipArray = minutely.map(item => item.precip);

    var option = {
      title: {
        text: hourWeather.summary,
        left: 'center'
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['现在', '', '', '', '', '', '', '', '', '', '', '1小时后', '', '', '', '', '', '', '', '', '', '', '', '2小时后'],
        show: true,
        axisLabel: { // x轴文字倾斜
          interval: 0,
          rotate: 0, //倾斜度 -90 至 90 默认为0
          margin: 10,
          textStyle: {
            fontWeight: "bolder",
            color: "#111e36"
          }
        }
      },
      yAxis: {
        x: 'center',
        type: 'value',
        axisLabel: {
          show: false, // 不显示坐标轴上的文字
        }
      },
      series: [{
        name: 'A',
        type: 'line',
        smooth: true,
        data: precipArray
      }]
    };
    chart.setOption(option);
  },
  showEcharts() {
    this.echartsComponnet = this.selectComponent('#mychart-dom-bar');
    this.getData('echartsComponnet', 0); //获取数据
  },
})


function isToday(date) {
  // 获取当前日期
  var today = new Date();
  var year = today.getFullYear(); // 获取年份
  var month = today.getMonth() + 1; // 获取月份（注意：月份从0开始，所以要加1）
  var day = today.getDate(); // 获取日期

  var formattedToday = year + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day);

  // 判断是否为今天
  if (date === formattedToday) {
    return true
  }
  return false
}