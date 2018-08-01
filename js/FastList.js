class FastList {
  constructor(dom) {
    // 列表容器
    this.dom =dom
    // 每条列表项的最大计划高度，用于计算第一个item的位置和索引
    this.maxItemHeight = 500
    // 列表可见区域的高度
    this.viewPortHeight = $(window).height()
    // 顶部占位View
    this.topView = document.createElement('div')
    // 底部占位View
    this.bottomView = document.createElement('div')
    this.dom.append(this.topView)
    this.dom.append(this.bottomView)
    this.avgHeight = 0
    this.heightMap = {}
    this.datas = []
    this.holders = []
    FastList.instances.push(this)
  }

  setHandler(handler){
    this.handler = handler
  }

  setDatas(datas){
    this.datas = datas
    this.notifyAll()
  }

  notifyAll(){
    this.scroll()
  }

  getTop(){
    return this.topView.clientHeight || 0
  }

  getHeight(){
    return this.dom.clientHeight || 0
  }

  getViewPortHeight(){
    this.dom.parent
  }

  getAvgHeight(){
    let index = 0
    let totalHeight = 0
    let {heightMap, datas} = this
    for (var k in heightMap) {
      let v = heightMap[k]
      index++
      totalHeight += v
    }
    let avgHeight = parseInt(totalHeight / index)
    return avgHeight
  }

  getPositionAndIndex(scrollTop){
    let index = 0
    let totalHeight = 0
    let {heightMap, datas} = this
    for (var k in heightMap) {
      let v = heightMap[k]
      if (totalHeight+v>=scrollTop) {
        return {position:totalHeight, index:index}
      }
      index++
      totalHeight += v
    }
    if (totalHeight==0) {
      return {position: 0, index: 0};
    }
    let avgHeight = parseInt(totalHeight / index)
    index = parseInt(scrollTop / avgHeight)
    if (index>datas.length - 1) {
      index = datas.length - 1
    }
    totalHeight = avgHeight * index;
    return {position: totalHeight, index: index};
  }

  getTopPosition(scrollTop){
    if (scrollTop == 0) {
      return 0;
    }
    let index = 0
    let totalHeight = 0
    let {heightMap, datas} = this
    for (var k in heightMap) {
      console.log('k = '+k);
      let v = heightMap[k] ||
      if (totalHeight+v>=scrollTop) {
        return totalHeight
      }
      index++
      totalHeight += v
    }
  }

  getHolder(type){
    let holder = this.handler.createViewHolder(type)
    this.dom.append(holder.dom)
    this.dom.append(this.bottomView)
    return holder
  }

  bindData(type, index, holder, data){
    this.handler.bindData(type, index, holder, data)
  }

  getBottom(holder){
    let dom = holder.dom
    console.log('dom bottom:'+(dom.offsetTop + dom.clientHeight));
    return dom.offsetTop + dom.clientHeight
  }

  scroll(event){
    let {topView, bottomView, datas, holders} = this
    let windowHeight = $(window).height();
    let scrollTop = $(window).scrollTop();
    let topPosition = this.getTopPosition(scrollTop)
    let topIndex = this.getTopIndex(topPosition)

    // var {position, index} = this.getPositionAndIndex(scrollTop)
    topView.style.height = topPosition + 'px'
    var i = topIndex
    for (; i < datas.length; i++) {
      let holder = holders[i-topIndex]
      let data = datas[i]
      if (!holder) {
        holder = this.getHolder(data.type)
        holders.push(holder)
      }
      // holder.top = topPosition
      this.bindData(data.type, i, holder, data)
      this.heightMap[i] = holder.dom.clientHeight
      topPosition += holder.dom.clientHeight
      if (this.getBottom(holder) > windowHeight) {
        break
      }
    }
    // bottomView.top = topPosition
    bottomView.style.height = (datas.length - i) * this.getAvgHeight() + 'px'
  }

}

FastList.instances = [];
FastList.scroll = function (event) {
  FastList.instances.forEach(function (instance) {
    instance.scroll(event);
  });
};
$(window).scroll(function(event){
  FastList.scroll(event);
});
