// pages/tide/tide.js
import * as echarts from '../../ec-canvas/echarts.min';
const util = require('../../utils/util.js')

// 付费key
const charge_weather_key = '85df4159ecb14556bd88696334386822'
let chart = null;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    address: "",
    latitude: 0,
    longitude: 0,
    poiId: '',
    tideHourData: [],
    tideTableData: [],
    highTideData: null,
    lowTideData: null,
    echartsComponnet: null,
    ganhaiDataArray: '',
    selectedDate: '',
    tabData: [], // 存储近十天的数据
    ec: {
      lazyLoad: true // 延迟加载
    },
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
        that.fetchPoiData(res.data.longitude, res.data.latitude,
          function (data) {
            // 成功回调，打印返回数据
            if (data.code == 200) {
              that.getTideData(that.data.selectedDate, data.poi[0].id)
              that.setData({
                poiId: data.poi[0].id,
              })
            } else {
              wx.showToast({
                title: '未查询到潮汐数据',
                icon: 'none',
              })
            }
            console.log('请求成功，返回的数据:', data);
          },
          function (errorMessage) {
            // 错误回调，打印错误信息
            console.error('请求失败:', errorMessage);
          });
      }
    });
  },

  // 生成今天及以后的十天的数据
  generateTabData: function () {
    let tabData = [];
    let today = new Date();
    let currentDate = new Date(today); // 当前日期

    // 默认选中今天
    this.setData({
      selectedDate: this.formatDate(currentDate)
    });

    console.log

    // 生成今天及以后的 10 天
    for (let i = 0; i < 10; i++) {
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
    this.setData({
      selectedDate: selectedDate
    });
    // 更新选中的日期的状态
    let tabData = this.data.tabData.map(item => {
      item.isSelected = item.date === selectedDate ? 1 : 0;
      return item;
    });

    this.setData({
      tabData: tabData
    });

    if (this.data.poiId.length == 0) {

      wx.showToast({
        title: '未查询到潮汐数据',
        icon: 'none',
      })
      return
    }
    this.getTideData(this.data.selectedDate, this.data.poiId)

  },


  // 格式化 fxTime 为 hh:mm
  formatTime(time) {
    const date = new Date(time);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  },

  fetchPoiData(lon, lat, successCallback, errorCallback) {
    // 请求接口的URL
    const url = 'https://geoapi.qweather.com/v2/poi/lookup'
    // 请求参数
    const params = {
      key: charge_weather_key,
      location: `${lon},${lat}`,
      // location: `119.433786,39.797511`,
      type: 'TSTA'
    }

    // 发送GET请求
    wx.request({
      url: url, // 请求的接口地址
      method: 'GET', // 请求方法
      data: params, // 请求的参数
      success(res) {
        console.log('poi数据 ', res)
        // 请求成功的回调函数
        if (res.statusCode === 200) {
          // 调用成功回调并传递数据
          successCallback(res.data);
        } else {
          // 处理错误状态码
          errorCallback(`请求失败，状态码：${res.statusCode}`);
        }
      },
      fail(error) {
        // 请求失败的回调函数
        errorCallback(`请求失败：${error.errMsg}`);
      }
    });
  },

  // 获取潮汐数据
  getTideData(date, locationId) {

    console.log('请求潮汐数据日期 ', date)

    if (date?.length == 0) {
      wx.showToast({
        title: '请求日期为空',
        icon: 'none',
      })
      return
    }

    const that = this
    wx.request({
      url: 'https://api.qweather.com/v7/ocean/tide',
      method: 'GET', //请求的方式
      data: { //发送到服务器的数据
        location: locationId,
        date: date,
        key: charge_weather_key
      },
      success: function (res) { // 请求成功之后的回调函数
        console.log('潮汐data ', res)
        const code = res.data.code

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

        const tideHourlys = res.data.tideHourly
        if (tideHourlys && tideHourlys.length > 0) {
          const tideTableArray = res.data.tideTable

          const changedTideTable = that.changeTideTable(tideTableArray)
          console.log('满潮信息  ',changedTideTable)
          that.setData({
            tideHourData: tideHourlys,
            tideTableData: changedTideTable
          })
          that.showEcharts()
        } else {
          that.setData({
            tideHourData: [],
            tideTableData: [],
            highTideData: null,
            lowTideData: null,
            ganhaiDataArray: '',
          })
          wx.showToast({
            title: '未查询到潮汐数据',
            icon: 'none',
          })
        }
        wx.hideLoading();

      },
      fail: function (res) {
        console.log('获取潮汐数据失败: ', res)
        wx.showToast({
          title: '未查询到潮汐数据',
          icon: 'none',
        })
      }
    })

  },

  changeTideTable(tideTable) {
    // 转换逻辑
    const transformedTideTable = tideTable.map(item => {
      // 提取 fxTime 的小时和分钟部分
      const time = item.fxTime.split('T')[1].split('+')[0].substring(0, 5); // 提取 "HH:MM"
      // 根据 type 转换为中文描述
      const type = item.type === "H" ? "满潮" : "干潮";
      // 构建新结构
      return {
        fxTime: time,
        height: item.height,
        type: type
      };
    });
    return transformedTideTable
  },

  selectLocation() {
    const that = this
    console.log('潮汐选择定位')
    wx.chooseLocation({
      success: function (res) {
        console.log('潮汐选择坐标', res);
        //  wx.showLoading({
        //   title: '获取中...', // 提示的内容
        //   mask: true // 是否显示透明蒙层，防止触摸穿透，默认为 false
        // });
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          address: res?.address || '这是哪里？',
        })

        that.fetchPoiData(res.longitude, res.latitude,
          function (data) {
            // 成功回调，打印返回数据
            if (data.code == 200) {
              that.setData({
                poiId: data.poi[0].id,
              })
              that.getTideData(that.data.selectedDate, data.poi[0].id)
            } else {
              that.setData({
                poiId: '',
                tideHourData: [],
                tideTableData: [],
                highTideData: null,
                lowTideData: null,
                ganhaiDataArray: '',
              })
              wx.showToast({
                title: '未查询到潮汐数据',
                icon: 'none',
              })
            }
            console.log('请求成功，返回的数据:', data);
          },
          function (errorMessage) {
            // 错误回调，打印错误信息
            console.error('请求失败:', errorMessage);
          });

      },
      fail: function () {},
      complete: function () {}
    })
  },

  showEcharts() {
    this.echartsComponnet = this.selectComponent('#tide-dom-bar');
    this.getData('echartsComponnet', 0); //获取数据
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
    const hourly = this.data.tideHourData
    console.log('潮汐小时数据q ', hourly)

    const hourlyArray = hourly.map(item => parseFloat(item.height));
    console.log('潮汐高度 ', hourlyArray)

    const minValue = Math.min(...hourlyArray);
    const minNumber = this.roundToNearestHalf(minValue);

    // 获取最小和最大值的索引
    const minIndex = hourlyArray.indexOf(Math.min(...hourlyArray));
    const maxIndex = hourlyArray.indexOf(Math.max(...hourlyArray));
    // 初始化横坐标数组（24小时）
    let xAxisData = new Array(24).fill(''); // 初始化为空字符串

    // 固定两端的时间
    xAxisData[0] = '00:00';
    xAxisData[23] = '23:00';

    // 显示最小值和最大值对应的时间
    xAxisData[minIndex] = `${minIndex < 10 ? '0' : ''}${minIndex}:00`;
    xAxisData[maxIndex] = `${maxIndex < 10 ? '0' : ''}${maxIndex}:00`;

    const ganhaiTime1 = this.findTidePeriodsBelowThreshold(hourlyArray, 0.5)
    const ganhaiTime2 = this.findTidePeriodsBelowThreshold(hourlyArray, 1)
    const ganhaiTime3 = this.findTidePeriodsBelowThreshold(hourlyArray, 1.5)

    const ganhaiArray = []
    if (ganhaiTime1.length > 0) {
      let timeStr = ganhaiTime1.join(', ')
      timeStr = `${timeStr}（赶海指数：优，潮高低于0.5米）`
      ganhaiArray.push(timeStr)
    }
    if (ganhaiArray.length == 0 && ganhaiTime2.length > 0) {
      let timeStr = ganhaiTime2.join(', ')
      timeStr = `${timeStr}（赶海指数：良，潮高低于1米）`
      ganhaiArray.push(timeStr)
    }
    if (ganhaiArray.length == 0 && ganhaiTime3.length > 0) {
      let timeStr = ganhaiTime3.join(', ')
      timeStr = `${timeStr}（赶海指数：中，潮高低于1.5米）`
      ganhaiArray.push(timeStr)
    }
    if (ganhaiArray.length == 0) {
      ganhaiArray.push("赶海指数：差，潮高大于1.5米，不宜赶海")
    }
    console.log('赶海时间：', ganhaiArray)

    this.setData({
      ganhaiDataArray: ganhaiArray
    })
    const formattedDate = this.data.selectedDate.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');

    var option = {
      title: {
        text: `${formattedDate} 潮汐数据（单位：米）`,
        left: 'center'
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisData,
        show: true,
        axisLabel: { // x轴文字倾斜
          interval: 0,
          rotate: 45, //倾斜度 -90 至 90 默认为0
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
        min: -1,
        axisLabel: {
          show: true, // 不显示坐标轴上的文字
        }
      },
      series: [{
        name: 'A',
        type: 'line',
        smooth: true,
        data: hourlyArray
      }]
    };
    chart.setOption(option);
  },

  // 自定义函数：补0.5
  roundToNearestHalf(value) {
    // 获取小数部分
    const decimalPart = Math.abs(value) % 1;

    // 判断并调整到最近的0.5
    if (decimalPart < 0.5) {
      // 对于负数时，应该减去 0.5
      return value < 0 ? Math.floor(value) - 0.5 : Math.floor(value) + 0.5;
    } else {
      // 对于负数时，应该加上 0.5
      return value < 0 ? Math.ceil(value) - 0.5 : Math.ceil(value) + 0.5;
    }
  },

  findTidePeriodsBelowThreshold(hourlyArray, threshold) {
    let periods = [];
    let start = null; // 用于标记开始时间
    let isDescending = false; // 标记是否在下降趋势中

    for (let i = 1; i < hourlyArray.length; i++) { // 从第2个数据点开始（索引1）
      let currentTide = hourlyArray[i]; // 获取当前小时的潮位
      let previousTide = hourlyArray[i - 1]; // 获取前一个小时的潮位
      let currentTime = `${i.toString().padStart(2, '0')}:00`; // 格式化当前时间字符串
      let previousTime = `${(i - 1).toString().padStart(2, '0')}:00`; // 前一个小时的时间

      // 判断潮汐是否低于阈值并且处于下降趋势
      if (currentTide < threshold && currentTide < previousTide) {
        if (start === null) { // 如果没有开始时间，说明找到了下降趋势的开始
          start = currentTime;
          isDescending = true;
        }
      } else if (currentTide >= threshold || currentTide > previousTide) {
        // 如果潮位大于等于阈值或潮位上升，并且之前有下降趋势，说明找到了时间段的结束
        if (start !== null && isDescending) {
          // 如果开始和结束时间相同，取前一个小时作为结束时间
          if (start === previousTime) {
            periods.push(`${(i - 2).toString().padStart(2, '0')}:00-${previousTime}`);
          } else {
            periods.push(`${start}-${previousTime}`);
          }
          start = null; // 重置开始时间
          isDescending = false; // 重置下降趋势标记
        }
      }
    }

    // 处理最后一段，如果仍然处于下降趋势并且结束时间未设置
    if (start !== null && isDescending) {
      let lastHour = (hourlyArray.length - 1).toString().padStart(2, '0') + ':00';
      if (start !== lastHour) {
        // 如果最后一个时间段的开始和结束时间不相同，正常返回
        periods.push(`${start}-${lastHour}`);
      } else {
        // 如果最后一段时间段的开始时间和结束时间相同，取前一个小时
        periods.push(`${(hourlyArray.length - 2).toString().padStart(2, '0')}:00-${lastHour}`);
      }
    }

    return periods;
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