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

        if (res.data.address.length > 0) {
          that.setData({
            address: res.data.address,
            latitude: res.data.latitude,
            longitude: res.data.longitude,
          })
          that.fetchData()
        } else {
          console.log('未缓存位置信息')
          that.getUserLocation()
        }
      },
      fail(error) {
        console.log('未缓存位置信息: ', error)
        that.getUserLocation()
      }
    });

    // 若在开发者工具中无法预览广告，请切换开发者工具中的基础库版本
    // 在页面中定义插屏广告
    let interstitialAd = null

    // 在页面onLoad回调事件中创建插屏广告实例
    if (wx.createInterstitialAd) {
      interstitialAd = wx.createInterstitialAd({
        adUnitId: 'adunit-4ebe927a5bc6e9d4'
      })
      interstitialAd.onLoad(() => {})
      interstitialAd.onError((err) => {
        console.error('插屏广告加载失败', err)
      })
      interstitialAd.onClose(() => {})
    }

    // 在适合的场景显示插屏广告
    if (interstitialAd) {
      interstitialAd.show().catch((err) => {
        console.error('插屏广告显示失败', err)
      })
    }
  },

  fetchData() {
    const that = this
    if (!this.data.longitude || !this.data.latitude) {
      console.log('未查到信息 2')

      wx.showToast({
        title: '未获取到位置信息',
        icon: 'none',
      })
      return
    }
    this.fetchPoiData(this.data.longitude, this.data.latitude,
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
        that.fetchData()
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

    // 默认选中今天
    this.setData({
      selectedDate: this.formatDate(currentDate)
    });

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

    console.log('llllllll  ',event.currentTarget)
    const that = this
    const selectIndex = event.currentTarget.dataset.index;
    if (selectIndex >= 5) {
      wx.showToast({
        title: '完成广告即可查询',
        icon: 'none',
      })
      this.showInspireAd( function (data) {
        // 成功回调，打印返回数据
        console.log('激励广告完成')
        that.startGetTideData(selectedDate)
        wx.showToast({
          title: '免费不易，感谢支持~',
          icon: 'none',
        })
      },
      function (errorMessage) {
        // 错误回调，打印错误信息
        console.log('激励广告未完成')
        console.error('请求失败:', errorMessage);
        wx.showToast({
          title: '未完成，无法获取奖励',
          icon: 'none',
        })
      })
    } else {
      this.startGetTideData(selectedDate)
    }
  },

  startGetTideData(selectdate) {

    this.setData({
      selectedDate: selectdate
    });
    // 更新选中的日期的状态
    let tabData = this.data.tabData.map(item => {
      item.isSelected = item.date === selectdate ? 1 : 0;
      return item;
    });

    this.setData({
      tabData: tabData
    });
    if (!this.data.latitude || !this.data.longitude) {
      console.log('未查到信息 1')
      wx.showToast({
        title: '未获取到位置信息',
        icon: 'none',
      })
      return
    }
    if (this.data.poiId.length == 0) {
      wx.showToast({
        title: '未查询到潮汐数据',
        icon: 'none',
      })
      return
    }
    this.getTideData(this.data.selectedDate, this.data.poiId)
  },

  showInspireAd(successCallback, errorCallback) {
    // 若在开发者工具中无法预览广告，请切换开发者工具中的基础库版本
    // 在页面中定义激励视频广告
    let videoAd = null
    // 在页面onLoad回调事件中创建激励视频广告实例
    if (wx.createRewardedVideoAd) {
      videoAd = wx.createRewardedVideoAd({
        adUnitId: 'adunit-940259f74a6bc5d7'
      })
      videoAd.onLoad(() => {})
      videoAd.onError((err) => {
        console.error('激励视频光告加载失败', err)
      })
      videoAd.onClose((res) => {
        // 用户点击了【关闭广告】按钮
        if (res && res.isEnded) {
          // 正常播放结束，可以下发游戏奖励
          console.log('激励广告完成')
          successCallback()
        } else {
          console.log('激励广告未完成')
          // 播放中途退出，不下发游戏奖励
          errorCallback()
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
          })
      })
    }
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
          console.log('满潮信息  ', changedTideTable)
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
    xAxisData[12] = '12:00';

    // // 显示最小值和最大值对应的时间
    xAxisData[minIndex] = `${minIndex < 10 ? '0' : ''}${minIndex}:00`;
    xAxisData[maxIndex] = `${maxIndex < 10 ? '0' : ''}${maxIndex}:00`;

    const ganhaiDataArray = this.findTidalTrends(hourlyArray)
    console.log('合适赶海时间 ', ganhaiDataArray)
    const classifiedResult = this.classifyTidalTrends(ganhaiDataArray);
    console.log('分类赶海时间 ', classifiedResult)
    const processedResult = this.processClassifiedResult(classifiedResult);
    console.log('格式化赶海时间 ', processedResult)

    const ganhaiTime1 = processedResult.inclued_5
    const ganhaiTime2 = processedResult.inclued_10
    const ganhaiTime3 = processedResult.inclued_15
    const ganhaiArray = []

    if (ganhaiTime1.length > 0) {
      let timeStr = ganhaiTime1.join(', ')
      timeStr = `${timeStr}（赶海指数：优，低潮小于0.5米）`
      ganhaiArray.push(timeStr)
    }
    if (ganhaiTime2.length > 0) {
      let timeStr = ganhaiTime2.join(', ')
      timeStr = `${timeStr}（赶海指数：良，低潮小于1米）`
      ganhaiArray.push(timeStr)
    }
    if (ganhaiTime3.length > 0) {
      let timeStr = ganhaiTime3.join(', ')
      timeStr = `${timeStr}（赶海指数：中，低潮小于1.5米）`
      ganhaiArray.push(timeStr)
    }
    if (ganhaiArray.length == 0) {
      ganhaiArray.push("赶海指数：差，潮位较高，不宜赶海")
    }
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
        min: -0.5,
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

  classifyTidalTrends(tidalTrends) {
    const result = {
      inclued_15: [],
      inclued_10: [],
      inclued_5: []
    };

    tidalTrends.forEach(item => {
      const minTidalValue = Math.min(...item.trend); // 获取该趋势的最小潮汐值

      // 分类处理区间
      if (minTidalValue >= 1 && minTidalValue < 1.5) {
        result.inclued_15.push(item.section); // 将区间添加到 inclued_15 中
      } else if (minTidalValue >= 0.5 && minTidalValue < 1) {
        result.inclued_10.push(item.section); // 将区间添加到 inclued_10 中
      } else if (minTidalValue < 0.5) {
        result.inclued_5.push(item.section); // 将区间添加到 inclued_5 中
      }
    });

    // 确保每个字段始终是数组，如果没有符合的区间，数组为[]
    if (result.inclued_15.length === 0) result.inclued_15 = [];
    if (result.inclued_10.length === 0) result.inclued_10 = [];
    if (result.inclued_5.length === 0) result.inclued_5 = [];

    return result;
  },

  findTidalTrends(array) {
    const result = [];
    let trend = [];
    let startIndex = -1;

    // 遍历所有潮汐高度数据
    for (let i = 0; i < array.length; i++) {
      const current = array[i];

      // 判断是否满足潮汐小于2并且是下降趋势
      if (current < 2) {
        // debugger
        if (trend.length === 0) {
          // 开始一个新的下降趋势区间
          trend.push(current);
          startIndex = i;
        } else {
          const last = trend[trend.length - 1];
          // 如果是下降趋势，则加入当前值
          if (current <= last) {
            trend.push(current);
          } else {
            // 一旦出现上升，停止记录当前趋势
            if (trend.length > 1) {
              // 完成一个下降趋势区间
              if (startIndex > 0 && startIndex == i - 1) {
                //下降趋势只有一个点，取前一个点至当前点
                result.push({
                  trend: [...trend],
                  section: [startIndex - 1, startIndex]
                });
              } else {
                result.push({
                  trend: [...trend],
                  section: [startIndex, i - 1]
                });
              }
            }
            // 清空趋势，开始新的检查
            trend = [];
            startIndex = -1;
          }
        }
      } else {
        // 潮汐高度大于等于1.5，结束当前下降趋势
        if (trend.length > 1) {
          if (startIndex > 0 && startIndex == i - 1) {
            //下降趋势只有一个点，取前一个点至当前点
            result.push({
              trend: [...trend],
              section: [startIndex - 1, startIndex]
            });
          } else {
            result.push({
              trend: [...trend],
              section: [startIndex, i - 1]
            });
          }
        }
        trend = [];
        startIndex = -1;
      }
    }

    // 如果有剩余的下降趋势，最后需要保存
    if (trend.length > 1) {
      result.push({
        trend: [...trend],
        section: [startIndex, array.length - 1]
      });
    }

    return result;
  },

  // 将小时索引转为对应的时间字符串（例如6 -> "06:00"）
  formatTimeRange(startIndex, endIndex) {
    const startTime = startIndex < 10 ? `0${startIndex}:00` : `${startIndex}:00`;
    const endTime = endIndex < 10 ? `0${endIndex}:00` : `${endIndex}:00`;
    return `${startTime}-${endTime}`;
  },

  // 对 classifiedResult 进行处理，转换为时间字符串
  processClassifiedResult(classifiedResult) {
    const resultWithTime = {
      inclued_15: [],
      inclued_10: [],
      inclued_5: [],
    };

    // 处理 inclued_15 数组
    for (let i = 0; i < classifiedResult.inclued_15.length; i++) {
      const range = classifiedResult.inclued_15[i];
      resultWithTime.inclued_15.push(this.formatTimeRange(range[0], range[1]));
    }

    // 处理 inclued_10 数组
    for (let i = 0; i < classifiedResult.inclued_10.length; i++) {
      const range = classifiedResult.inclued_10[i];
      resultWithTime.inclued_10.push(this.formatTimeRange(range[0], range[1]));
    }

    // 处理 inclued_5 数组
    for (let i = 0; i < classifiedResult.inclued_5.length; i++) {
      const range = classifiedResult.inclued_5[i];
      if (range.length > 0) {
        resultWithTime.inclued_5.push(this.formatTimeRange(range[0], range[1]));
      }
    }

    return resultWithTime;
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