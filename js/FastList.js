class FastList {
  constructor(root) {
    this.root = root
    this.root.style.position = 'relative'
    this.root.style.overflowY = 'auto'
    this.maxItemHeight = 100
    this.anchor = document.createElement('div')
    this.anchor.style.height='1px'
    this.anchor.style.width='1px'
    this.anchor.style.position='absolute'
    this.anchor.style.transform='translateY(0px)'
    this.root.append(this.anchor)
    this.datas = []
    this.holders = {}
    this.cacheHolders = {}
    this.updateTime = 0

    this.root.onscroll = ()=>{
      if (Date.now() - this.updateTime < 30) {
        clearTimeout(this.timer)
        this.timer = setTimeout(()=>{
          this.scroll();
        }, 20)
      } else {
        this.scroll();
      }
    }
  }

  setHandler(handler){
    this.handler = handler
  }

  setDatas(datas){
    this.datas = datas || []
    this.anchor.style.transform=`translateY(${this.datas.length*this.maxItemHeight}px)`
    this.holderMap = {}
    this.notifyAll()
    this.setUpNoData()
  }

  setUpNoData(){
    if (this.datas.length > 0) {
      if (this.noDataView) {
        this.root.remove(this.noDataView)
      }
    } else {
      if (!this.noDataView) {
        let createNoDataView = ()=>{
          let h1 = document.createElement('h1')
          h1.innerText = 'NO DATA!'
          h1.classList.add('text-info')
          return h1
        }
        this.noDataView = this.handler.createNoDataView && this.handler.createNoDataView() || createNoDataView()
      }
      this.root.prepend(this.noDataView)
    }
  }

  notifyAll(){
    this.scroll()
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

  recycleViews(){
    for (var type in this.holders) {
      this.holders[type] = this.holders[type].filter((holder)=>{
        let pos = parseInt(holder.dom.style.transform.match(/\d+/))
        let holders = this.cacheHolders[type]
        if (!holders) { holders = this.cacheHolders[type] = [] }
        holders.push(holder)
        holder.dom.style.opacity=0
        return false
      })
    }
  }

  scroll(){
    this.updateTime = Date.now()
    let topPosition = parseInt(this.root.scrollTop / this.maxItemHeight) * this.maxItemHeight
    let breakHeight = this.maxItemHeight + this.root.clientHeight
    this.recycleViews()
    let countHeight = 0
    let index = parseInt(this.root.scrollTop / this.maxItemHeight)
    let domNum = 0
    if (index > this.datas.length) {
      this.root.scrollTop = this.maxItemHeight*this.datas.length-breakHeight
    }
    for (; index < this.datas.length; index++, domNum++) {
      let data = this.datas[index]
      let holder = this.getHolder(data.type)
      this.handler.bindData(data.type, index, holder, data)
      holder.dom.style.transform=`translateY(${topPosition+countHeight}px)`
      countHeight += holder.dom.clientHeight
      if (countHeight>= breakHeight) {
        domNum++
        break
      }
    }
    if (countHeight) {
      this.maxItemHeight = countHeight / domNum || 100
      this.anchor.style.transform=`translateY(${this.datas.length*this.maxItemHeight}px)`
    }
  }
}

module.exports = FastList
