// index.js
var QQMapWX = require('../../utils/libs/qqmap/qqmap-wx-jssdk.js');
var qqmapsdk;

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    location: {
      latitude: 0,
      longitude: 0,
      address:'',
    },
    dayWeather:{},
    dayImage:'',
    weatherInfo:null

    // hasUserInfo: false,
    // canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    // canIUseNicknameComp: wx.canIUse('input.type.nickname'),
  },
  onLoad: function () {
    // 实例化API核心类
    qqmapsdk = new QQMapWX({
        key: 'XHPBZ-S7CWW-VYQRA-YJIOI-QDZOT-EAFJL'
    });
    this.getUserLocation()
},

      // 获取位置信息
      getUserLocation() {
        console.log('点击位置');
        const that = this
        wx.getLocation({
          type: 'gcj02',
          isHighAccuracy: true,   // 开启高精度
          success (res) {
            const latitude = res.latitude
            const longitude = res.longitude
            console.log('位置信息  ',res);
            that.setData({
              "location.latitude": res.latitude,
              "location.longitude": res.longitude,
            })
            // that.location.latitude = latitude
            // that.location.longitude = longitude
            that.fetchAddress(longitude,latitude)
            that.fetchDayWeather(longitude,latitude)
            that.fetchMinuteWeather(longitude,latitude)
          },
          fail(res) {
            console.log('位置信息失败  ',res);
          }
         })
      },
      fetchAddress(lon, lat) {
        const that = this
        qqmapsdk.reverseGeocoder({
          location:{
            latitude: lat,
            longitude: lon
          },
          success: function (res1) {
            console.log(res1.result);
            const address = res1.result.address_component
            const addressDetail = `${address.city} ${address.district} ${address.street}`
            that.setData({
              "location.address": addressDetail,
            })
          },
          fail: function (res) {
            console.log(res);
          }
        })
      },
      // 近两小时天气
      fetchMinuteWeather(lon, lat) {
        if (!lon || !lat) {
          console.log('经纬度为空');
          return
        }
        const that = this
        wx.request({
          url:'https://devapi.qweather.com/v7/minutely/5m',
          method: 'GET',      //请求的方式
          data: {             //发送到服务器的数据
            location: `${lon},${lat}`,
            key: '46dc1503ca4b4b189c88ac475ce69b1f'
          },
          success:function(res){ // 请求成功之后的回调函数
            console.log('近两小时天气 ',res)
            that.setData({
              "weatherInfo": res.data,
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
          url:'https://devapi.qweather.com/v7/weather/now',
          method: 'GET',      //请求的方式
          data: {             //发送到服务器的数据
            location: `${lon},${lat}`,
            key: '46dc1503ca4b4b189c88ac475ce69b1f'
          },
          success:function(res){ // 请求成功之后的回调函数
            console.log('实时天气 ',res)
            const now = res.data.now
            const imageCode = now.icon
            const imageUrl = `../../assets/icon_weather/${imageCode}.png`
            that.setData({
              "dayWeather": now,
              "dayImage":imageUrl
            })
          }
        })
      },
      // https://devapi.qweather.com/v7/minutely/5m?location=103.38,30.90&key=46dc1503ca4b4b189c88ac475ce69b1f
  getUserProfile(e) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
})
