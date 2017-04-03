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
    this.bottomLayout = $(this.itemLayoutTempl);
    this.root.append(this.bottomLayout);
    this.bottomLayout[0].style.position = 'absolute';
    this.bottomLayout[0].style.top = '0px';
    this.bottomLayout[0].style.width = '1px';
    this.bottomLayout[0].style.height = '1px';
    this.viewportHeightIndex = -1;
    this.viewportHeight = 0;   // 列表总高度

    this.setHandle = function (handle_) {
      this.handle = handle_;
    };

    this.setDatas = function (datas_) {
      this.datas = datas_;
      this.updateList();
      this.viewportHeightIndex = -1;
      this.viewportHeight = 0;
    };

    this.windowHeight = $(window).height();
    this.scrollTop = $(window).scrollTop();
    this.overflowHeight = -500;
    this.topSpace = 0;
    this.bottomSpace = this.windowHeight;
    this.totalItemHeight = 0;
    this.topIndex = -1;
    this.bottomIndex = -1;

    this.updateList = function () {
      // console.log('updateList===============');

      // 加载底部 view
      var reverse = false;
      var startIndex = 0;
      var holderPositon = 0;
      var curPosition = 0;
      var curHolder = null;
      if (this.holderStack.length > 0) {
        curHolder = this.holderStack[holderPositon];
        startIndex = curHolder._index;
        curPosition = curHolder.view.offset().top;
      }
      // 正向加载
      for (var i = startIndex; i < this.datas.length; i++) {
        curHolder = this.holderStack[holderPositon - 1];
        if (!!curHolder && this.getHolderBottomOffset(curHolder) <= this.overflowHeight) {
          break;
        }
        var holder = this.getViewHolder(i, reverse);
        var data = this.datas[i];
        this.bindData(i, holder, data);
        holder.view[0].style.top = curPosition + 'px';
        curPosition += holder.view.height();
        holderPositon++;
      }
    };

    this.getViewHolder = function (index, reverse) {
      if (this.holderStack.length > 300) {
        this.recycle();
      }
      for(var i=0; i<this.holderStack.length;i++){
        if(index == this.holderStack[i]._index){
          return this.holderStack[i];
        }
      }
      if (this.holderCache.length == 0) {
        console.log("cerate new viewholder ============");
        var view = $(this.itemTempl);
        var holder = this.handle.createViewHolder(view);
        holder.view = view;
        if (reverse) {
          this.holderStack.unshift(holder);
        } else {
          this.holderStack.push(holder);
        }
        this.root.append(holder.view);
        var left = holder.view.offset().left;
        holder.view[0].style.position = 'absolute';
        holder.view[0].style.left = left + 'px';
        holder.view[0].style.width = holder.view.width() + 'px';
        holder._index = -1;
        holder._height = 0;
        return holder;
      }
      var holder = this.holderCache.pop();
      if (reverse) {
        this.holderStack.unshift(holder);
      } else {
        this.holderStack.push(holder);
      }
      holder._height = 0;
      holder._data = null;
      holder._index = -1;
      return holder;
    };

    this.bindData = function(i, holder, data){
      this.handle.bindData(i, holder, data);
      holder._index = i;
      holder._data = data;
      if (this.viewportHeightIndex < i) {
        this.viewportHeightIndex = i;
        this.viewportHeight += holder.view.height();
        this.bottomLayout[0].style.top =  this.viewportHeight / (i+1) * this.datas.length + 'px';
      }
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
      if (this.holderStack.length == 0) {
        return;
      }
      var topArr = [];
      var bottomArr = [];
      var usedArr = [];
      var startIndex = -1;
      var endIndex = this.holderStack.length;
      for (var i = 0; i < this.holderStack.length; i++) {
        var holder = this.holderStack[i];
        if (this.getHolderTopOffset(holder) < this.overflowHeight && this.getHolderBottomOffset(holder) > this.overflowHeight){
          startIndex = i;
        } else if (this.getHolderTopOffset(holder) > this.overflowHeight && this.getHolderBottomOffset(holder) < this.overflowHeight) {
          endIndex = i;
          break;
        }
      }

      if(endIndex != this.holderStack.length){
        bottomArr = this.holderStack.splice(endIndex, this.holderStack.length);
      }
      if (startIndex != -1) {
        topArr = this.holderStack.splice(0, startIndex+1);
      }

      for (var i = 0; i < topArr.length; i++) {
        var holder = topArr[i];
        this.holderCache.push(holder);
      }
      for (var i = 0; i < bottomArr.length; i++) {
        var holder = bottomArr[i];
        this.holderCache.push(holder);
      }

    };

    this.log = function () {
      console.log('log begin =======================');
      console.dir(this.handle);
      console.dir(this.datas);
      console.log('log end =======================');
    };

    this.getHolderTopOffset = function (holder) {
      var top = holder.view.offset().top;
      return top - this.scrollTop;
    };

    this.getHolderBottomOffset = function (holder) {
      var bottom = holder.view.offset().top + holder.view.height();
      return this.windowHeight - ( bottom - this.scrollTop );
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
      // a.shift()
      // a.unshift(9)
      // a.pop()
      // a.push()

      // console.log('updateList===============');
      this.recycle();

      this.windowHeight = $(window).height();
      this.scrollTop = $(window).scrollTop();

      // 加载上部 view
      var topHolder = this.holderStack[0];
      if (this.getHolderTopOffset(topHolder) > this.overflowHeight) {
        var reverse = true;
        var startIndex = topHolder._index;
        var curPosition = topHolder.view.offset().top;
        for (var i = startIndex - 1; i >= 0; i--) {
          topHolder = this.holderStack[0];
          if (this.getHolderTopOffset(topHolder) <= this.overflowHeight) {
            break;
          }
          var data = this.datas[i];
          var holder = this.getViewHolder(i, reverse);
          this.bindData(i, holder, data);
          curPosition -= holder.view.height();
          holder.view[0].style.top = curPosition + 'px';
        }
      }

      // 加载底部 view
      var bottomHolder = this.holderStack[this.holderStack.length - 1];
      if (this.getHolderBottomOffset(bottomHolder) > this.overflowHeight) {
        var reverse = false;
        var startIndex = bottomHolder._index;
        var curPosition = bottomHolder.view.offset().top + bottomHolder.view.height();
        // 正向加载
        for (var i = startIndex + 1; i < this.datas.length; i++) {
          bottomHolder = this.holderStack[this.holderStack.length - 1];
          if (this.getHolderBottomOffset(bottomHolder) <= this.overflowHeight) {
            break;
          }
          var holder = this.getViewHolder(i, reverse);
          var data = this.datas[i];
          this.bindData(i, holder, data);
          holder.view[0].style.top = curPosition + 'px';
          curPosition += holder.view.height();
        }
      }
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
