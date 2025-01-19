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
    fifteenDayWeathers: [],
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
    if (tabId == 2 && (this.data.isChangeLocation || this.data.thirtyDayWeathers.length == 0)) {
      // 30日天气
      let long = this.data.location.longitude;
      let lat = this.data.location.latitude;
      console.log('保存的位置: ', this.data.location)
      // console.log( '保存的位置lat: ',lat)
      wx.showToast({
        title: '完成广告即可查询',
        icon: 'none',
      })
      const that = this
      this.showDayInspireAd( function (data) {
        // 成功回调，打印返回数据
        console.log('激励广告完成')
        that.setData({
          selectedTab: tabId,
        })
        that.fetchThirtyDayWeather(long, lat)
        wx.showToast({
          title: '免费不易，感谢支持~',
          icon: 'none',
        })
      },
      function (unfinishMessage) {
        // 错误回调，打印错误信息
        console.log('激励广告未完成')
        console.error('未完成:', unfinishMessage);
        wx.showToast({
          title: '未完成，无法获取奖励',
          icon: 'none',
        })
      },
      function (errorMessage) {
        // 错误回调，打印错误信息
        console.error('请求失败:', errorMessage);
        that.setData({
          selectedTab: tabId,
        })
        that.fetchThirtyDayWeather(long, lat)
      })
      return
    }
    this.setData({
      selectedTab: tabId,
    })
    if (tabId == 1 && (this.data.isChangeLocation || this.data.fifteenDayWeathers.length == 0)) {
      this.setData({
        selectedTab: tabId,
      })
      // 15日天气
      let long = this.data.location.longitude;
      let lat = this.data.location.latitude;
      console.log('保存的位置: ', this.data.location)
      // console.log( '保存的位置lat: ',lat)
      this.fetchFifteenDayWeather(long, lat)
    }
  },

  showDayInspireAd(successCallback, unfinishCallback, errorCallback) {
    // 若在开发者工具中无法预览广告，请切换开发者工具中的基础库版本
    // 在页面中定义激励视频广告
    let videoAd = null
    // 在页面onLoad回调事件中创建激励视频广告实例
    if (wx.createRewardedVideoAd) {
      videoAd = wx.createRewardedVideoAd({
        adUnitId: 'adunit-ed7705ba4283dea7'
      })
      videoAd.onLoad(() => {})
      videoAd.onError((err) => {
        console.error('激励视频光告加载失败', err)
        errorCallback()
      })
      videoAd.onClose((res) => {
        // 用户点击了【关闭广告】按钮
        if (res && res.isEnded) {
          // 正常播放结束，可以下发游戏奖励
          console.log('激励广告完成')
          successCallback()
        } else {
          console.log('激励广告未完成')
          unfinishCallback()
          // 播放中途退出，不下发游戏奖励
        }
      })
    }

    // 用户触发广告后，显示激励视频广告
    if (videoAd) {
      videoAd.show().catch(() => {
        // 失败重试
        videoAd.load()
          .then(() => videoAd.show())
          .catch(err => {
            console.error('激励视频 广告显示失败', err)
            errorCallback()
          })
      })
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
        const lastShowTime = wx.getStorageSync('lastShowTime'); // 获取上次弹框显示的时间
        const currentTime = new Date().getTime(); // 当前时间（毫秒）
        // 如果上次弹框时间不存在，或者距离现在已经超过24小时，则显示弹框
        if (!lastShowTime || Math.abs(currentTime - lastShowTime) > 12 * 60 * 60 * 1000) {
          wx.showModal({
            title: '定位未授权',
            content: '查询附近天气信息需授权定位，是否去设置？',
            confirmText: '去设置', // 修改确定按钮文案
            cancelText: '取消', // 修改取消按钮文案        
            success(res) {
              if (res.confirm) {
                // 用户点击去设置，打开小程序的设置页面
                wx.openSetting({
                  success(settingRes) {
                    // 可以检查是否授权了定位
                    if (settingRes.authSetting['scope.userLocation']) {
                      // 如果用户授权了，重新调用获取位置的方法
                      console.log('用户授权')
                      that.onLoad();
                    } else {
                      // 用户仍未授权，提示用户
                      wx.showToast({
                        title: '定位权限未授权',
                        icon: 'none'
                      });
                    }
                  }
                });
              }
              wx.setStorageSync('lastShowTime', new Date().getTime());
            }
          });
        }


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
          fifteenDayWeathers: [],
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
          title: '获取天气失败',
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
          title: '获取天气失败',
          icon: 'none',
        })
      }
    })
  },

    // 30日天气
    fetchFifteenDayWeather(lon, lat) {
      if (!lon || !lat) {
        return
      }
      const that = this
      wx.request({
        url: 'https://api.qweather.com/v7/weather/15d',
        method: 'GET', //请求的方式
        data: { //发送到服务器的数据
          location: `${lon},${lat}`,
          key: charge_weather_key
        },
        success: function (res) { // 请求成功之后的回调函数
          console.log('15日天气 ', res)
          const code = res.data.code
          console.log('15日天气code ', code)
  
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
          const daysRes = res.data.daily
          if (daysRes) {
            daysRes.forEach(function (obj) {
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
            fifteenDayWeathers: daysRes,
            isLoading: false,
            isChangeLocation: false
          })
        },
        fail: function (res) {
          console.log('获取15日天气失败: ', res)
          wx.hideLoading();
          that.setData({
            isLoading: false
          })
          wx.showToast({
            title: '获取天气失败',
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