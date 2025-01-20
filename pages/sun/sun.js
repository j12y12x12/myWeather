// pages/sun/sun.js

const charge_weather_key = '85df4159ecb14556bd88696334386822'
const util = require('../../utils/util.js')

let videoAd = null

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

        if (res.data.address.length > 0) {
          that.setData({
            address: res.data.address,
            latitude: res.data.latitude,
            longitude: res.data.longitude,
          })
          that.getSunData()
        } else {
          console.log('未缓存位置信息')
          that.getUserLocation()
        }
      },
      fail(error) {
        console.log('未缓存位置信息: ',error)
        that.getUserLocation()
      }
    });
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
            latitude: res.latitude,
            longitude: res.longitude,
          })
          that.getSunData()
          that.fetchAddress(longitude, latitude)
        },
        fail(res) {
          wx.showToast({
            title: '获取位置信息失败',
            icon: 'none',
          })
          console.log('位置信息失败  ', res);
        }
      })
    },
  
    fetchAddress(lon, lat) {
      const that = this
      util.fetchAddress(lon, lat,
        function (data) {
          // 成功回调，打印返回数据
          that.setData({
            address: data,
          })
        },
        function (errorMessage) {
          // 错误回调，打印错误信息
          console.error('请求失败:', errorMessage);
          that.setData({
            address: '地址解析错误',
          })
          wx.showToast({
            title: '地址解析失败',
            icon: 'none',
          })
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
    console.log('llllllll  ',event.currentTarget)
    const that = this
    const selectIndex = event.currentTarget.dataset.index;
    if (selectIndex >= 6 && util.checkAdLimit()) {
      wx.showToast({
        title: '完成广告即可查询',
        icon: 'none',
      })
      this.showSunInspireAd( function (data) {
        // 成功回调，打印返回数据
        console.log('激励广告完成')
        that.startGetSunData(selectedDate)
        wx.showToast({
          title: '免费不易，感谢支持~',
          icon: 'none',
        })
      },
      function () {
        // 错误回调，打印错误信息
        console.log('激励广告未完成')
        wx.showToast({
          title: '未完成，无法获取奖励',
          icon: 'none',
        })
      },
      function (errorMessage) {
        // 错误回调，打印错误信息
        console.error('请求失败:', errorMessage);
        that.startGetSunData(selectedDate)
      })
    } else {
      this.startGetSunData(selectedDate)
    }

  },

  startGetSunData(selectDate) {

    const showDate = selectDate.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');

    this.setData({
      selectedDate: selectDate,
      showSelectedDate: showDate
    });
    // 更新选中的日期的状态
    let tabData = this.data.tabData.map(item => {
      item.isSelected = item.date === selectDate ? 1 : 0;
      return item;
    });

    this.setData({
      tabData: tabData
    });

    this.getSunData()
  },


  showSunInspireAd(successCallback, unfinishCallback, errorCallback) {
    // 若在开发者工具中无法预览广告，请切换开发者工具中的基础库版本
    // 在页面中定义激励视频广告
    // 在页面onLoad回调事件中创建激励视频广告实例
    if (wx.createRewardedVideoAd) {
      if (!videoAd) {
        videoAd = wx.createRewardedVideoAd({
          adUnitId: 'adunit-635e89465f456b53'
        })
      }

      //解决多次事件回调
      try {
        if (videoAd.closeHandler) {
          videoAd.offClose(videoAd.closeHandler);
          console.log("videoAd.offClose卸载成功");
        }
      } catch (e) {
        console.log("videoAd.offClose 卸载失败");
      }
      videoAd.closeHandler = function (res) {
        // 用户点击了【关闭广告】按钮
        if ((res && res.isEnded) || res === undefined) {
          // 正常播放结束，可以下发游戏奖励
          successCallback()
          util.onAdComplete()
          console.log('正常播放完成',res)
        } else {
          //提前关闭小程序
          console.log('中途退出', res);
          console.log('激励广告未完成')
          unfinishCallback()
        }
      };

      videoAd.onLoad(() => {})
      videoAd.onError((err) => {
        console.error('激励视频光告加载失败', err)
        errorCallback()
      })
      videoAd.onClose(videoAd.closeHandler)
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
    } else {
      errorCallback()
    }
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
        that.getSunData()
      },
      fail: function () {},
      complete: function () {}
    })
  },

  // 获取日出日落数据
  getSunData() {

    const date = this.data.selectedDate
    const lon = this.data.longitude
    const lat = this.data.latitude

    if (!lon || !lat) {
      wx.showToast({
        title: '未获取到位置信息',
        icon: 'none',
      })
      return
    }
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

  },
   // 分享给朋友
   onShareAppMessage() {

  },
  // 分享到朋友圈
  onShareTimeline() {

  },
})