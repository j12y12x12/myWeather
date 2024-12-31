
// components/more_service.js
Component({

  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    buttons: [
      { name: '潮汐数据', action: 'showTide' },
      { name: '修改数据', action: 'updateData' },
      { name: '调用接口', action: 'callAPI' }
    ]
    },

  /**
   * 组件的方法列表
   */
  methods: {

    onButtonClick(e) {
      const { action } = e.currentTarget.dataset; // 获取自定义的 action

      // 根据不同的 action 执行不同的操作
      switch(action) {
        case 'showTide':
          console.log('点击潮汐')
          wx.navigateTo({
            url: '/pages/tide/tide'
          });
          break;
        default:
          console.log('未定义的操作');
      }
    },
  }
})