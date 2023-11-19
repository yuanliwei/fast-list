import { ListState } from "./lib.js"

/**
 * @typedef {{dom:HTMLElement}&Record<object,object>} Holder
 */

export class FastList {
  /**
   * @param {HTMLElement} list
   * @param {number} scrollTop
   */
  constructor(list, scrollTop) {
    this.list = list
    this.scrollTop = scrollTop || 0
    this.listState = new ListState(null)
    this.list.style.position = 'relative'
    this.list.style.overflowY = 'auto'
    this.scroller = document.createElement('span')
    this.scroller.style.display = 'block'
    this.scroller.style.width = '10px'
    this.list.prepend(this.scroller)
    this.size = 0
    /** @type{Record<string|number,Holder[]>} */
    this.holders = {}
    /** @type{Record<string|number,Holder[]>} */
    this.cacheHolders = {}

    this.listState.updateListClientHeight(list.clientHeight)

    this.listState.init(this.list, this.scrollTop, (o) => {
      this.renderData = o.renderData
      this.renderStart = o.renderStart
      this.renderOffsets = o.renderOffsets
      this.scrollBarHeight = o.scrollBarHeight
      this.scrollTop = o.scrollTop
      this.renderList()
    })

    this.resizeObserver = new ResizeObserver(() => {
      this.listState.updateListClientHeight(list.clientHeight)
    })
    this.resizeObserver.observe(this.list)

    const listState = this.listState
    this.listeners = {
      onTouchStart(/**@type{*}*/e) { listState.onTouchStart(e) },
      onTouchMove(/**@type{*}*/e) { listState.onTouchMove(e) },
      onTouchEnd(/**@type{*}*/e) { listState.onTouchEnd(e) },
      onWheel(/**@type{*}*/e) { listState.onWheel(e) },
      onScroll() { listState.onScroll() },
    }

    this.list.addEventListener("wheel", this.listeners.onWheel, { passive: false })
    this.list.addEventListener("touchstart", this.listeners.onTouchStart, { passive: true })
    this.list.addEventListener("touchmove", this.listeners.onTouchMove, { passive: false })
    this.list.addEventListener("touchend", this.listeners.onTouchEnd)
    this.list.addEventListener("scroll", this.listeners.onScroll)
  }

  destroy() {
    this.resizeObserver.unobserve(this.list)
    this.list.removeEventListener("wheel", this.listeners.onWheel)
    this.list.removeEventListener("touchstart", this.listeners.onTouchStart)
    this.list.removeEventListener("touchmove", this.listeners.onTouchMove)
    this.list.removeEventListener("touchend", this.listeners.onTouchEnd)
    this.list.removeEventListener("scroll", this.listeners.onScroll)
  }

  /**
   * @param {number} scrollTop
   * @param {boolean} [animation]
   */
  async scrollToWithListScrollTop(scrollTop, animation) {
    await this.listState.scrollToWithListScrollTop(scrollTop, animation)
  }

  /**
   * @param {number} offset
   * @param {boolean} animation
   */
  async scrollListOffset(offset, animation) {
    await this.listState.scrollListOffset(offset, animation)
  }

  /**
   * @param {number} percent 0-1
   * @param {boolean} [animation]
   */
  async scrollToPercent(percent, animation) {
    await this.listState.scrollToPercent(percent, animation)
  }

  /**
   * @param {number} index
   * @param {boolean} [animation]
   */
  async scrollToPosition(index, animation) {
    await this.listState.scrollToPosition(index, animation)
  }

  async reset() {
    await this.listState.reset()
  }

  /**
   * @param {any[]} data
   */
  updateListData(data) {
    this.listState.updateListData(data)
  }
  /**
   * @param {number} size
   */
  updateListDataSize(size) {
    this.listState.updateListDataSize(size)
  }
  /**
   * @param {number} listClientHeight
   */
  updateListClientHeight(listClientHeight) {
    this.listState.updateListClientHeight(listClientHeight)
  }

  /**
   * @param {{createViewHolder: (type:string|number)=>Holder,bindData:(type:string|number,position:number,holder:Holder,data:object)=>void}} handler
   */
  setHandler(handler) {
    this.handler = handler
  }

  /**
   * @param {any[]} datas
   */
  setDatas(datas) {
    this.updateListData(datas)
  }

  notifyAll() {
    this.renderList()
  }

  /**
   * @param {string | number} type
   */
  getHolder(type) {
    let holders = this.cacheHolders[type]
    if (!holders) { holders = this.cacheHolders[type] = [] }
    let holder = holders.pop()
    if (!holder) {
      holder = this.handler.createViewHolder(type)
      holder.dom.style.position = 'absolute'
      holder.dom.style.width = `100%`
      this.list.append(holder.dom)
    } else {
      holder.dom.style.opacity = '1'
    }
    holders = this.holders[type]
    if (!holders) { holders = this.holders[type] = [] }
    holders.push(holder)
    holder.dom.parentElement.append(holder.dom)
    return holder
  }

  recycleViews() {
    for (var type in this.holders) {
      this.holders[type] = this.holders[type].filter((holder) => {
        let holders = this.cacheHolders[type]
        if (!holders) { holders = this.cacheHolders[type] = [] }
        holders.push(holder)
        holder.dom.style.opacity = '0'
        return false
      })
    }
  }

  renderList() {
    this.recycleViews()
    this.scroller.style.height = this.scrollBarHeight + 'px'
    for (let i = 0; i < this.renderData.length; i++) {
      const data = this.renderData[i]
      let holder = this.getHolder(data?.type)
      this.handler.bindData(data?.type, i + this.renderStart, holder, data)
      holder.dom.style.top = this.renderOffsets[i] + 'px'
    }
  }
}

