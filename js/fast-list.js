var FastList = (function () {
  function FastList(root_) {
    this.root = root_;
    var layout = this.root.find('.item-layout');
    var item = this.root.find('.item');
    this.itemTempl = layout.html();
    this.handle = null;
    this.datas = [];
    item.remove();
    this.itemLayoutTempl = root.html();
    layout.remove();
    this.topLayout = $(this.itemLayoutTempl);
    this.contentLayout = $(this.itemLayoutTempl);
    this.bottomLayout = $(this.itemLayoutTempl);
    this.root.append(this.topLayout);
    this.root.append(this.contentLayout);
    this.root.append(this.bottomLayout);


    this.setHandle = function (handle_) {
      this.handle = handle_;
    };

    this.setDatas = function (datas_) {
      this.datas = datas_;
      this.updateList();
    };

    this.windowHeight = $(window).height();
    this.scrollTop = $(window).scrollTop();
    this.overflowHeight = 200;
    this.topSpace = 0;
    this.bottomSpace = this.windowHeight;
    this.totalItemHeight = 0;
    this.topIndex = -1;
    this.bottomIndex = -1;

    this.updateList = function () {
      // console.log('updateList===============');
      this.scrollTop = $(window).scrollTop();
      var topIndex = 0;
      if (this.holderStack.length > 0) {
        topIndex = this.holderStack[0]._index;
      }
      for (var i = topIndex; i < datas.length; i++) {
        var curItemsHeight = this.totalItemHeight + this.topSpace;
        var curScrollHeight = this.scrollTop + this.windowHeight;
        if (curItemsHeight - curScrollHeight > this.overflowHeight) {
          break;
        }
        var holder = this.getViewHolder(i);
        if (holder._data === datas[i]) {
          continue;
        }
        this.bindData(i, holder, datas[i]);
      }

      this.recycle();
    };

    this.getViewHolder = function (index) {
      for(var i=0; i<this.holderStack.length;i++){
        if(index == this.holderStack[i]._index){
          return this.holderStack[i];
        }
      }
      if (this.holderCache.length == 0) {
        console.log("cerate new viewholder ============");
        var holder = this.handle.createView(this.itemTempl);
        this.holderStack.push(holder);
        holder._index = -1;
        holder._height = 0;
        return holder;
      }
      var holder = this.holderCache.pop();
      this.holderStack.push(holder);
      holder._height = 0;
      holder._data = null;
      holder._index = -1;
      return holder;
    };

    this.bindData = function(i, holder, data){
      this.handle.bindData(i, holder, data);
      if (this.topIndex == -1) {
        this.topIndex = i;
        this.changeBottomLayout(i, holder);
      } else if (i < this.topIndex) {
        this.changTopLayout(i, holder);
      } else if (i > this.bottomIndex) {
        this.changeBottomLayout(i, holder);
      } else {
        this.changeBottomLayout(i, holder);
      }
      holder._index = i;
      holder._data = data;
    };

    this.changTopLayout = function(i, holder){
      this.topIndex = i;
      if(holder._index != i){
        this.contentLayout.prepend(holder.view);
      }
      var height = holder._height;
      holder._height = holder.view.height();
      this.totalItemHeight += (holder._height - height);
      this.topSpace -= (holder._height - height);

      if (this.topSpace < 0) {
        this.topSpace = 0;
      }
      this.topLayout.height(this.topSpace);
    };

    this.changeBottomLayout = function(i, holder){
      this.bottomIndex = i;
      if(holder._index != i){
        this.contentLayout.append(holder.view);
      }
      var height = holder._height;
      holder._height = holder.view.height();
      this.totalItemHeight += (holder._height - height);

      var totalHeight = this.getTotalHeight();
      this.bottomSpace = totalHeight - this.topSpace - this.totalItemHeight;
      if (this.bottomSpace < 0) {
        this.bottomSpace == 0;
      }
      this.bottomLayout.height(this.bottomSpace);
    };

    this.getTotalHeight = function(){
      var height = 0;
      if(this.holderStack.length == 0) return 0;
      this.holderStack.forEach(function(holder){
        height += holder._height;
      });
      var avgHeight = height / this.holderStack.length;
      return avgHeight * this.datas.length;
    };

    this.recycle = function () {
      var topArr = [];
      var bottomArr = [];
      var usedArr = [];
      for (var i = 0; i < this.holderStack.length; i++) {
        var holder = this.holderStack[i];
        if (this.scrollTop - holder.view.offset().top - holder.view.height() > this.overflowHeight + 100){
          topArr.push(holder);
        } else if (holder.view.offset().top + holder.view.height() - this.scrollTop - this.windowHeight > this.overflowHeight + 100) {
          bottomArr.push(holder);
        } else {
          usedArr.push(holder);
        }
      }
      var topHeight = 0;
      var bottomHeight = 0;

      var msg = [];
      msg.push('[')
      topArr.forEach(function (holder) {
        msg.push(holder._index);
      });
      msg.push(']');
      msg.push('[')
      usedArr.forEach(function (holder) {
        msg.push(holder._index);
      });
      msg.push(']');
      msg.push('[')
      bottomArr.forEach(function (holder) {
        msg.push(holder._index);
      });
      msg.push(']');
      console.log(msg.join());
      for (var i = 0; i < topArr.length; i++) {
        var holder = topArr[i];
        topHeight += holder._height;
        holder.view.remove();
        this.holderCache.push(holder);
      }
      for (var i = 0; i < bottomArr.length; i++) {
        var holder = bottomArr[i];
        bottomHeight += holder._height;
        holder.view.remove();
        this.holderCache.push(holder);
      }
      var maxIndex = -1;
      var minIndex = 9999999;
      for (var i = 0; i < usedArr.length; i++) {
        var holder = usedArr[i];
        if (holder._index>maxIndex) {
          maxIndex = holder._index;
        }
        if (holder._index<minIndex) {
          minIndex = holder._index;
        }
      }
      this.topIndex = minIndex;
      this.bottomIndex = maxIndex;

      this.topLayout.height(this.topSpace + topHeight);
      this.bottomLayout.height(this.bottomSpace + bottomHeight);
      this.holderStack = usedArr;
    };

    this.log = function () {
      console.log('log begin =======================');
      console.dir(this.handle);
      console.dir(this.datas);
      console.log('log end =======================');
    };

    this.holderStack = [];
    this.holderCache = [];
    this.itemHeight = 0;
    this.scroll = function (event) {
      // console.log('onScroll '+ event+'   top  ' + $(window).scrollTop());
      // holder.view.offset().top
      // holder.view.height()
      // $(window).scrollTop();
      // $(window).height()
      // s.splice(0,1) 删除指定元素
      var windowHeight = $(window).height();
      var scrollTop = $(window).scrollTop();
      this.updateList();

    };

    FastList.instances.push(this);
  };

  FastList.instances = [];
  FastList.scroll = function (event) {
    FastList.instances.forEach(function (instance) {
      instance.scroll(event);
    });
  };
  $(window).scroll(function(event){
    FastList.scroll(event);
  });

  return FastList;
})();
