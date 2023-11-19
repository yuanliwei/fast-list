export class ListState {
    /**
     * @param {() => Promise<void>} tick
     */
    constructor(tick) {
        /** @type{Map<number,number>} */
        this.sizeMap = new Map()
        this.listClientHeight = 0
        this.listScrollTop = 0
        this.listPageSize = 0
        this.itemOffsetList = []
        this.listRenderStart = 0
        this.scrollBarHeight = 0
        this.listContentHeight = 0
        this.scrollStateVersion = 0

        this.lastTouchY = 0
        this.lastTouchTime = 0
        this.touchSpeed = 0
        this.flingSpeed = 0

        this.data = []
        this.dataSize = 0
        this.renderData = []

        this.tick = tick || (() => new Promise((resolve) => setTimeout(resolve)))
    }

    /**
     * @param {HTMLElement} list
     * @param {number} scrollTop
     * @param {{(data:{renderData:any[];renderOffsets:number[];scrollBarHeight:number;renderStart:number;scrollTop:number;}):void;}} callback
     */
    async init(list, scrollTop, callback) {
        this.list = list
        this.listScrollTop = scrollTop
        this.hasInit = true
        this.onUpdate = callback
        this.refresh()
    }

    async refresh() {
        if (this.hasInit) {
            await this.renderList(this.listScrollTop, this.data)
        }
    }

    /**
     * @param {number} height
     */
    updateListClientHeight(height) {
        this.listClientHeight = height
        this.refresh()
        this.scrollToWithListScrollTop(this.listScrollTop, false)
    }

    /**
     * @param {any[]} data
     */
    updateListData(data) {
        this.data = data
        this.dataSize = data.length
        this.refresh()
    }

    /**
     * @param {number} size
     */
    updateListDataSize(size) {
        this.dataSize = Math.max(this.dataSize, size)
        this.refresh()
    }

    /**
     * @param {number} scrollTop
     * @param {boolean} [animation]
     */
    async scrollToWithListScrollTop(scrollTop, animation) {
        let diff = scrollTop - this.listScrollTop
        let version = ++this.scrollStateVersion
        if (animation) {
            let delta = (scrollTop - this.listScrollTop) * 0.2
            let changed = true
            while (changed && this.scrollStateVersion == version) {
                await animationFrame()
                changed = this.updateListScrollTop(delta)
                delta = (scrollTop - this.listScrollTop) * 0.2
            }
        } else {
            this.updateListScrollTop(diff)
        }
    }

    /**
     * @param {number} offset
     * @param {boolean} animation
     */
    async scrollListOffset(offset, animation) {
        let countListScrollTop = offset + this.listScrollTop
        await this.scrollToWithListScrollTop(countListScrollTop, animation)
    }

    /**
     * @param {number} percent 0-1
     * @param {boolean} [animation]
     */
    async scrollToPercent(percent, animation) {
        let countListScrollTop = percent * (this.listContentHeight - this.list.clientHeight)
        await this.scrollToWithListScrollTop(countListScrollTop, animation)
    }

    /**
     * @param {number} index
     * @param {boolean} [animation]
     */
    async scrollToPosition(index, animation) {
        let countListScrollTop = countListContentHeightWithIndex(this.sizeMap, index)
        await this.scrollToWithListScrollTop(countListScrollTop, animation)
    }

    async reset() {
        this.sizeMap.clear()
        await this.refresh()
    }

    /**
     * @param {TouchEvent} e
     */
    onTouchStart(e) {
        this.lastTouchY = e.touches[0].clientY
        this.lastTouchTime = e.timeStamp
        this.touchSpeed = 0
        this.scrollStateVersion++
    }

    /**
     * @param {TouchEvent} e
     */
    onTouchMove(e) {
        let y = e.touches[0].clientY
        let deltaY = this.lastTouchY - y
        this.touchSpeed = deltaY / (e.timeStamp - this.lastTouchTime)
        this.lastTouchY = y
        this.lastTouchTime = e.timeStamp
        if (this.updateListScrollTop(deltaY)) {
            e.preventDefault()
        }
    }


    /**
     * @param {TouchEvent} e
     */
    async onTouchEnd(e) {

        if (this.flingSpeed * this.touchSpeed < 0 || Math.abs(this.touchSpeed) < 3) {
            this.flingSpeed = this.touchSpeed
        } else {
            this.flingSpeed += this.touchSpeed
        }

        if (Math.abs(this.flingSpeed) > 10) {
            this.flingSpeed *= 3
        }

        let time = performance.now()
        let speedDelta = 0.99
        let version = ++this.scrollStateVersion
        let changed = true
        while (changed && version == this.scrollStateVersion) {
            await animationFrame()
            changed = this.updateListScrollTop(this.flingSpeed * (performance.now() - time))
            time = performance.now()
            this.flingSpeed *= speedDelta
        }
    }

    /**
     * @param {WheelEvent} e
     */
    onWheel(e) {
        if (e.ctrlKey && e.cancelable) {
            return
        }
        this.scrollStateVersion++
        if (this.updateListScrollTop(e.deltaY)) {
            e.preventDefault()
        }
    }

    onScroll() {
        if (this.skipOnScrollEventOnce) {
            this.skipOnScrollEventOnce = false
            return
        }
        let percent = this.list.scrollTop / (this.scrollBarHeight - this.list.clientHeight)
        let countListScrollTop = percent * (this.listContentHeight - this.list.clientHeight)
        if (Math.abs(countListScrollTop - this.listScrollTop) > 1) {
            this.scrollStateVersion++
            this.updateListScrollTop(countListScrollTop - this.listScrollTop)
        }
    }

    /**
     * @param {number} deltaY
     * @returns {boolean} true if listScrollTop changed
     */
    updateListScrollTop(deltaY) {
        if (!this.list) {
            return false
        }

        let countListScrollTop = this.listScrollTop + deltaY

        if (countListScrollTop < 0) {
            countListScrollTop = 0
        }

        if (countListScrollTop > this.listContentHeight - this.listClientHeight) {
            countListScrollTop = this.listContentHeight - this.listClientHeight
        }

        if (this.dataSize < this.listPageSize) {
            countListScrollTop = 0
        }

        if (Math.abs(countListScrollTop - this.listScrollTop) > 0.01) {
            this.listScrollTop = countListScrollTop
            this.renderList(this.listScrollTop, this.data)

            return true
        } else {
            return false
        }
    }

    /**
    * @param {number} scrollTop
    * @param {object[]} [datas]
    */
    async renderList(scrollTop, datas) {
        let o = countOffsetAndStartIndex(this.sizeMap, this.dataSize, this.listClientHeight, scrollTop)
        this.scrollBarHeight = Math.min(this.listContentHeight, 100000)
        let percent = scrollTop / (this.listContentHeight - this.listClientHeight)
        let countScrollTop = percent * (this.scrollBarHeight - this.listClientHeight)

        o.offsets = o.offsets.map(o => o + countScrollTop)

        this.listRenderStart = o.startIndex
        this.itemOffsetList = o.offsets
        this.listPageSize = this.itemOffsetList.length
        let end = this.listRenderStart + this.itemOffsetList.length
        if (this.data.length < this.dataSize) {
            this.renderData = Array.from({ length: this.itemOffsetList.length })
        } else {
            this.renderData = datas.slice(this.listRenderStart, end)
        }

        this.onUpdate({
            renderData: this.renderData,
            renderStart: this.listRenderStart,
            renderOffsets: this.itemOffsetList,
            scrollBarHeight: this.scrollBarHeight,
            scrollTop: scrollTop,
        })

        await this.tick()

        if (this.dataSize == 0) {
            return
        }

        if (Math.abs(countScrollTop - this.list.scrollTop) > 0.01) {
            this.skipOnScrollEventOnce = true
            this.list.scrollTop = countScrollTop
        }

        let heightMapChange = false

        let nodes = [...this.list.childNodes].filter((o) => o.nodeName == "DIV")
        let previousNodeHeight = 0
        let entries = [...this.sizeMap.entries()].sort((l, h) => l[0] - h[0])
        for (let i = 0; i < entries.length; i++) {
            const [index, value] = entries[i]
            if (index <= this.listRenderStart) {
                previousNodeHeight = value
            } else {
                break
            }
        }
        for (let i = 0; i < this.renderData.length && i < nodes.length; i++) {
            /** @type{*} */
            let node = nodes[i]
            /** @type{number} */
            let nodeHeight = node.clientHeight
            if (nodeHeight != previousNodeHeight && nodeHeight > 0) {
                previousNodeHeight = nodeHeight
                let index = this.listRenderStart + i
                if (this.sizeMap.get(index) != nodeHeight) {
                    this.sizeMap.set(index, nodeHeight)
                    heightMapChange = true
                }
            }
        }
        if (heightMapChange) {
            this.listContentHeight = countListContentHeightWithIndex(this.sizeMap, this.dataSize)
            await this.renderList(scrollTop, datas)
        }
    }

}

/**
 * @param {Map<number, number>} map
 * @param {number} index
 */
function countListContentHeightWithIndex(map, index) {
    let entries = [...map.entries()].sort((l, h) => l[0] - h[0])
    let listContentHeight = 0
    let previousIndex = 0
    let previousValue = 0
    for (let i = 0; i < entries.length; i++) {
        const [indexKey, value] = entries[i]
        if (indexKey > index) {
            listContentHeight += (index - previousIndex) * previousValue
            return listContentHeight
        }
        listContentHeight += (indexKey - previousIndex) * previousValue
        previousIndex = indexKey
        previousValue = value
    }
    listContentHeight += (index - previousIndex) * previousValue
    return listContentHeight
}

/**
 * @param {Map<number, number>} map
 * @param {number} size
 * @param {number} listClientHeight
 * @param {number} scrollTop
 */
export function countOffsetAndStartIndex(map, size, listClientHeight, scrollTop) {

    let offsets = []
    let startIndex = 0

    let entries = [...map.entries()].sort((l, h) => l[0] - h[0])

    let listContentHeight = 0
    let listItemOffset = 0

    let previousIndex = 0
    let previousValue = 0
    for (let i = 0; i < entries.length; i++) {
        const [index, value] = entries[i]
        let contentHeight = listContentHeight + (index - previousIndex) * previousValue
        if (contentHeight > scrollTop) {
            break
        }
        listContentHeight = contentHeight
        previousIndex = index
        previousValue = value
    }

    if (previousValue == 0) {
        offsets = [0]
        startIndex = 0
        return { startIndex, offsets }
    }

    startIndex = Math.floor((scrollTop - listContentHeight) / previousValue) + previousIndex
    listItemOffset = (listContentHeight - scrollTop) % previousValue

    offsets.push(listItemOffset)
    let itemIndex = startIndex
    let currentListBottom = listItemOffset + previousValue
    while (++itemIndex < size && currentListBottom < listClientHeight) {
        offsets.push(currentListBottom)
        let height = previousValue
        if (map.has(itemIndex)) {
            height = previousValue = map.get(itemIndex)
        }
        currentListBottom += height
    }

    return { startIndex, offsets }
}

const animationFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))
