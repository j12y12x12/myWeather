// index.js
const chooseLocation = requirePlugin('chooseLocation');
var QQMapWX = require('../../utils/libs/qqmap/qqmap-wx-jssdk.js');
import * as echarts from '../../ec-canvas/echarts.min';
const qqmapKey ='XHPBZ-S7CWW-VYQRA-YJIOI-QDZOT-EAFJL'

var qqmapsdk;
let chart = null;
const weather_key ='46dc1503ca4b4b189c88ac475ce69b1f'

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

const weeks = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

Page({
  data: {
    location: {
      latitude: 0,
      longitude: 0,
    },
    address:'',
    isLoading:true,
    dayWeather:{},
    sevenDayWeathers:[],
    hourWeather:{},
    dayImage:'',
    echartsComponnet:null,
    ec: {
      lazyLoad: true // 延迟加载
    }
    // hasUserInfo: false,
    // canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    // canIUseNicknameComp: wx.canIUse('input.type.nickname'),
  },
  // 分享给朋友
  onShareAppMessage () {
    
  },
  // 分享到朋友圈
  onShareTimeline () {

  },
  // onShow: function() {
  //   // 页面显示时触发的操作

  //   console.log('选择器  ',chooseLocation);
  //   // const location = chooseLocation.getLocation(); 
  //   // console.log('选择的地点  ',location);
  // },
  onLoad: function () {
    // 实例化API核心类
    qqmapsdk = new QQMapWX({
        key: qqmapKey
    });
    this.setData({
      "isLoading": true,
    })
    this.getUserLocation()
},

      // 获取位置信息
      getUserLocation() {

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
            that.fetchAllWeatherInfo(longitude,latitude)
          },
          fail(res) {
            wx.hideLoading();
            that.setData({
              "isLoading": false,
            })
            console.log('位置信息失败  ',res);
          }
         })
      },
      selectLocation() {
        const that = this

        wx.chooseLocation({
          success: function (res) {
             console.log('选择坐标',res); 
             wx.showLoading({
              title: '获取中...', // 提示的内容
              mask: true // 是否显示透明蒙层，防止触摸穿透，默认为 false
            });
            that.setData({
              "isLoading": true,
              "dayWeather":{},
              "sevenDayWeathers":[],
              "hourWeather":{},
              "dayImage":''
            })
             that.fetchAllWeatherInfo(res.longitude,res.latitude)
           },
           fail: function () {
           },
           complete: function () {
           }
       })
      },
      fetchAllWeatherInfo(lon, lat) {
        this.fetchAddress(lon,lat)
        this.fetchDayWeather(lon,lat)
        this.fetchMinuteWeather(lon,lat)
        this.fetch7DayWeather(lon,lat)
      },
      fetchAddress(lon, lat) {
        const that = this
        qqmapsdk.reverseGeocoder({
          location:{
            latitude: lat,
            longitude: lon
          },
          success: function (res1) {
            const address = res1.result.address_component
            let addressDetail = ''
            if (address.city && address.district) {
              addressDetail = address.street ? `${address.city} ${address.district} ${address.street}`:`${address.city} ${address.district}`
            } else {
              addressDetail = '这是哪里？'
            }
            that.setData({
              "address": addressDetail,
            })
            wx.hideLoading();
            that.setData({
              "isLoading": false,
            })
          },
          fail: function (res) {
            wx.hideLoading();
            that.setData({
              "isLoading": false,
            })
            wx.showToast({
              title: '地址解析失败',
              icon: 'none',
            })
          }
        })
      },
      // 近两小时天气
      fetchMinuteWeather(lon, lat) {
        if (!lon || !lat) {
          return
        }
        const that = this
        wx.request({
          url:'https://devapi.qweather.com/v7/minutely/5m',
          method: 'GET',      //请求的方式
          data: {             //发送到服务器的数据
            location: `${lon},${lat}`,
            key: weather_key
          },
          success:function(res){ // 请求成功之后的回调函数
            that.setData({
              "hourWeather": res.data,
            })
            console.log('近两小时天气 ',that.data.hourWeather)
            that.showEcharts()
          },
          fail:function(res) {
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
          url:'https://devapi.qweather.com/v7/weather/now',
          method: 'GET',      //请求的方式
          data: {             //发送到服务器的数据
            location: `${lon},${lat}`,
            key: weather_key
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
          },
          fail:function(res) {

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
          url:'https://devapi.qweather.com/v7/weather/7d',
          method: 'GET',      //请求的方式
          data: {             //发送到服务器的数据
            location: `${lon},${lat}`,
            key: weather_key
          },
          success:function(res){ // 请求成功之后的回调函数
            console.log('7日天气 ',res)
            const sevneDays = res.data.daily
            if (sevneDays) {
              sevneDays.forEach(function(obj) {
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
            that.setData({
              "sevenDayWeathers": sevneDays,
            })

          },
          fail:function(res) {

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
        data: ['现在','','','','','','','','','','','1小时后','','','','','','','','','','','','2小时后'],
        show: true,
        axisLabel:{  // x轴文字倾斜
          interval:0,
          rotate:0,//倾斜度 -90 至 90 默认为0
          margin:10,
          textStyle:{
          fontWeight:"bolder",
          color:"#111e36"
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
  yAxisData() {
    const timeArray = [];

// 生成空字符串项
for (let i = 0; i <= 23; i++) {
  timeArray.push('');
}

return ['现','在','','','','','','','','','','','','','','','','','','','2','小','时','后']
  }
})


// function initChart(canvas, width, height, dpr) {
//   chart = echarts.init(canvas, null, {
//     width: width,
//     height: height,
//     devicePixelRatio: dpr // new
//   });
//   canvas.setChart(chart);
 

//   return chart;
// }

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