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
    this.viewportHeight = 0;

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
    this.overflowHeight = 200;
    this.topSpace = 0;
    this.bottomSpace = this.windowHeight;
    this.totalItemHeight = 0;
    this.topIndex = -1;
    this.bottomIndex = -1;
    this.curPosition = 0;

    this.updateList = function () {
      // console.log('updateList===============');
      var startIndex = 0;
      var reverse = false;
      this.curPosition = 0;
      if (this.holderStack.length > 0) {
        var firstHolder = this.holderStack[0];
        startIndex = firstHolder._index;
        this.curPosition = firstHolder.view.offset().top;
      }
      // 正向加载
      for (var i = startIndex; i < this.datas.length; i++) {
        var overflow = this.curPosition - this.scrollTop - this.windowHeight - this.overflowHeight;
        if (overflow > 0) {
          break;
        }
        reverse = false;
        var holder = this.getViewHolder(i, reverse);
        var data = this.datas[i];
        if (holder._index == i && holder._data === data) {
          this.curPosition += holder.view.height();
        } else {
          this.bindData(i, holder, data);
          this.curPosition += holder.view.height();
        }
      }

      var lastHolder = this.holderStack[this.holderStack.length - 1];
      startIndex = lastHolder._index;
      this.curPosition = lastHolder.view.offset().top + lastHolder.view.height();
      // 逆向加载
      for (var i = startIndex; i >= 0; i--) {
        var overflow = this.curPosition - this.scrollTop + this.overflowHeight + 300;
        if (overflow < 0) {
          break;
        }
        reverse = true;
        var holder = this.getViewHolder(i, reverse);
        var data = this.datas[i];
        if (holder._index == i && holder._data === data) {
          this.curPosition -= holder.view.height();
        } else {
          this.bindData(i, holder, data);
          this.curPosition -= holder.view.height();
          holder.view[0].style.top = this.curPosition + 'px';
        }
      }

      this.recycle();
    };

    this.getViewHolder = function (index, reverse) {
      for(var i=0; i<this.holderStack.length;i++){
        if(index == this.holderStack[i]._index){
          return this.holderStack[i];
        }
      }
      if (this.holderCache.length == 0) {
        console.log("cerate new viewholder ============");
        var holder = this.handle.createView(this.itemTempl);
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
      holder.view[0].style.top = this.curPosition + 'px';
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
      var topArr = [];
      var bottomArr = [];
      var usedArr = [];
      var startIndex = -1;
      var endIndex = this.holderStack.length;
      for (var i = 0; i < this.holderStack.length; i++) {
        var holder = this.holderStack[i];
        var top = holder.view.offset().top;
        var height = holder.view.height();
        var scrollTop = this.scrollTop;
        if (top + height - scrollTop < 0 - this.overflowHeight - 100){
          startIndex = i;
        } else if (top + height - scrollTop > this.windowHeight + this.overflowHeight + 100) {
          endIndex = i;
        }
      }

      if(endIndex != this.holderStack.length){
        bottomArr = this.holderStack.splice(endIndex, this.holderStack.length);
      }
      if (startIndex != -1) {
        topArr = this.holderStack.splice(0, startIndex+1);
      }

      var msg = [];
      msg.push('[')
      topArr.forEach(function (holder) {
        msg.push(holder._index);
      });
      msg.push(']');
      msg.push('[')
      this.holderStack.forEach(function (holder) {
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

    };

    this.getHolderBottomOffset = function (holder) {

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

this.windowHeight

      var startIndex = 0;
      var reverse = false;
      this.curPosition = 0;
      if (this.holderStack.length > 0) {
        var firstHolder = this.holderStack[0];
        startIndex = firstHolder._index;
        this.curPosition = firstHolder.view.offset().top;
      }
      // 正向加载
      for (var i = startIndex; i < this.datas.length; i++) {
        var overflow = this.curPosition - this.scrollTop - this.windowHeight - this.overflowHeight;
        if (overflow > 0) {
          break;
        }
        reverse = false;
        var holder = this.getViewHolder(i, reverse);
        var data = this.datas[i];
        if (holder._index == i && holder._data === data) {
          this.curPosition += holder.view.height();
        } else {
          this.bindData(i, holder, data);
          this.curPosition += holder.view.height();
        }
      }

      var lastHolder = this.holderStack[this.holderStack.length - 1];
      startIndex = lastHolder._index;
      this.curPosition = lastHolder.view.offset().top + lastHolder.view.height();
      // 逆向加载
      for (var i = startIndex; i >= 0; i--) {
        var overflow = this.curPosition - this.scrollTop + this.overflowHeight + 300;
        if (overflow < 0) {
          break;
        }
        reverse = true;
        var holder = this.getViewHolder(i, reverse);
        var data = this.datas[i];
        if (holder._index == i && holder._data === data) {
          this.curPosition -= holder.view.height();
        } else {
          this.bindData(i, holder, data);
          this.curPosition -= holder.view.height();
          holder.view[0].style.top = this.curPosition + 'px';
        }
      }

      this.recycle();

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
