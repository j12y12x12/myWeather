// components/almanac/almanac.js
const util = require('../../utils/util.js')

Component({

  /**
   * 组件的属性列表
   */
  properties: {
    date: {
      type: String,
      value: '', // 默认值为空，表示如果父组件没有传递日期，使用当前日期
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    currentDate: '', // 用来保存当前日期
    almanacData: {
      yearTips: '',
      chineseZodiac: '',
      lunarCalendar: '',
      suit: '',
      avoid: ''
    },  // 当天黄历信息
  },

  /**
   * 组件的方法列表
   */
  methods: {

    fetchData() {
      const currentDay = util.formatWeekDate(this.properties.date)
      this.setData({
        currentDate:currentDay
      });
      const that = this
      wx.request({
        url: `https://www.mxnzp.com/api/holiday/single/${this.properties.date}?ignoreHoliday=false&app_id=shbrkriiyldirrkp&app_secret=h4woPcYimqHo4HHSuSWcJmWonUNKYDq9`, // 请求地址
        method: 'GET', // 请求方式
        success: (res) => {
          console.log('黄历结果: ',res.data)
          if (res.data.code == 1) {
            const almanacData = res.data.data
            almanacData.suit = almanacData?.suit?.replace(/\./g, ' ')
            almanacData.avoid = almanacData?.avoid?.replace(/\./g, ' ')
            that.setData({
              almanacData
            });
          } else if (res.data.code == 101){
            wx.showToast({
              title: '黄历超出限制，请稍后再试',
              icon: 'none',
            })
          } else {
            wx.showToast({
              title: '请求失败',
              icon: 'none',
            })
          }
        },
        fail: (err) => {
          console.error('请求失败', err);
        }
      });
    }
  },

    /**
   * 组件的生命周期钩子
   */
  lifetimes: {
    attached() {
      this.fetchData();
    }
  }
})