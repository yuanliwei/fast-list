# fast-list

显示大量数据列表的工具类，使用view回收重用方式实现。

## 使用示例
```javascript

// 初始化列表
let dom = document.querySelector('#list')
var list = new FastList(dom)
list.setHandler({
  createViewHolder: (type)=>{
    let view = $(`<div class="pt-1 col-12"><div class="alert alert-success" role="alert">
    <b></b> <span></span> </div></div>`)
    return {
      dom: view[0],
      num: view.find('b'),
      name: view.find('span')
    }
  },
  bindData: (type, position, holder, data)=>{
    holder.num.text(data.index)
    holder.name.text(data.name)
  }
})

// 测试数据
var datas = []
for (var i = 0; i < 100000; i++) {
  datas.push({
    type: 'item',
    index: i,
    name: 'name:'+i
  })
}

// setDatas
list.setDatas(datas)
```
