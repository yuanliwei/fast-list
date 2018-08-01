class FastList {
  constructor(root, options) {
    options = options || {}
    this.root = root
    this.root.style.position = 'relative'
    this.root.style.overflowY = 'auto'
    this.maxItemHeight = options.maxItemHeight || 100
    this.anchor = document.createElement('div')
    this.anchor.style.height='1px'
    this.anchor.style.width='1px'
    this.anchor.style.position='absolute'
    this.anchor.style.transform='translateY(0px)'
    this.root.append(this.anchor)
    this.datas = []
    this.holders = {}
    this.holderMap = {}
    this.cacheHolders = {}
    this.updateTime = 0
    FastList.instances.push(this)
    this.root.onscroll = ()=>{
      if (Date.now() - this.updateTime < 100) {
        clearTimeout(this.timer)
      }
      this.timer = setTimeout(()=>{
        this.scroll();
      }, 30)
    }
  }

  setHandler(handler){
    this.handler = handler
  }

  setDatas(datas){
    this.datas = datas || []
    this.anchor.style.transform=`translateY(${this.datas.length*this.maxItemHeight}px)`
    this.holderMap = {}
    this.recycleViews(1,-1)
    this.notifyAll()
  }

  notifyAll(){
    this.scroll()
  }

  getTopPosition(){
    return parseInt(this.root.scrollTop / this.maxItemHeight) * this.maxItemHeight
  }

  getTopIndex(){
    return parseInt(this.root.scrollTop / this.maxItemHeight)
  }

  getHolder(type){
    let holders = this.cacheHolders[type]
    if (!holders) { holders = this.cacheHolders[type] = [] }
    let holder = holders.pop()
    if (!holder) {
      holder = this.handler.createViewHolder(type)
      holder.dom.style.position='absolute'
      holder.dom.style.transform=`translateY(0px)`
      this.root.append(holder.dom)
    } else {
      holder.dom.style.opacity=1
    }
    holders = this.holders[type]
    if (!holders) { holders = this.holders[type] = [] }
    holders.push(holder)
    return holder
  }

  recycleViews(top, bottom){
    for (var type in this.holders) {
      this.holders[type] = this.holders[type].filter((holder)=>{
        let pos = parseInt(holder.dom.style.transform.match(/\d+/))
        // if (pos < top || pos > bottom) {
          let holders = this.cacheHolders[type]
          if (!holders) { holders = this.cacheHolders[type] = [] }
          holders.push(holder)
          holder.dom.style.opacity=0
          this.holderMap[holder.holderMapKey] = false
          return false
        // } else {
          // return true
        // }
      })
    }
  }

  scroll(){
    this.updateTime = Date.now()
    let topPosition = this.getTopPosition()
    let breakHeight = this.maxItemHeight + this.root.clientHeight
    this.recycleViews(topPosition, breakHeight)
    let countHeight = 0
    let i = this.getTopIndex()
    for (; i < this.datas.length; i++) {
      if (this.holderMap[i]) { continue }
      let data = this.datas[i]
      let holder = this.getHolder(data.type)
      this.holderMap[i] = true
      holder.holderMapKey = i
      this.handler.bindData(data.type, i, holder, data)
      holder.dom.style.transform=`translateY(${topPosition+countHeight}px)`
      countHeight += holder.dom.clientHeight
      if (countHeight>= breakHeight) {
        break
      }
    }
  }
}

FastList.instances = [];
FastList.scroll = function () {
  FastList.instances.forEach(function (instance) {
    if (Date.now() - instance.updateTime < 100) {
      clearTimeout(instance.timer)
    }
    instance.timer = setTimeout(()=>{
      instance.scroll();
    }, 30)
  });
};
$(window).scroll(function(event){
  FastList.scroll();
});
