var FastList = (function () {
  function FastList(root_) {
    this.root = root_;

    this.itemTempl = this.root.html();
    var item = this.root.find('.item');
    this.itemTopOffset = item.offset().top;
    this.itemLeftOffset = item.offset().left;
    this.itemWidth = item.width();
    item.remove();

    this.handle = null;
    this.datas = [];
    this.holderStack = [];
    this.holderCache = [];

    this.viewportHeightIndex = -1;
    this.viewportHeight = 0;   // 列表总高度
    this.windowHeight = $(window).height();
    this.scrollTop = $(window).scrollTop();
    this.overflowHeight = -500;

    this.setHandle = function (handle_) {
      this.handle = handle_;
    };

    this.setDatas = function (datas_) {
      this.datas = datas_;
      this.viewportHeightIndex = -1;
      this.viewportHeight = 0;
      this.updateList();
    };

    this.updateList = function () {
      // 加载底部 view
      var reverse = false;
      var startIndex = 0;
      var holderPositon = 0;
      var curPosition = this.itemTopOffset;
      var curHolder = null;
      this.viewportHeightIndex = -1;
      this.viewportHeight = 0;
      this.holderCache = this.holderCache.concat(this.holderStack);
      if (this.holderStack.length > 0) {
        curPosition = this.holderStack[0].view.offset().top;
        var startIndexAndCurPosition = this.countStartIndexAndCurPosition(curPosition);
        startIndex = startIndexAndCurPosition.start;
        curPosition = startIndexAndCurPosition.curPosition;
        console.log(JSON.stringify(startIndexAndCurPosition));
        this.viewportHeightIndex = startIndex;
        this.viewportHeight = curPosition;
        this.bottomLayout[0].style.top =  this.viewportHeight / (i+1) * this.datas.length + 'px';
      }
      this.holderStack.forEach(function (holder) {
        holder.view[0].style.display = 'none';
      });
      this.holderStack = [];

      for (var i = startIndex; i < this.datas.length; i++) {
        curHolder = this.holderStack[holderPositon - 1];
        if (!!curHolder && this.getHolderBottomOffset(curHolder) <= this.overflowHeight) {
          console.log('over!');
          break;
        }
        var holder = this.getViewHolder(i, reverse);
        var data = this.datas[i];
        this.bindData(i, holder, data);
        holder.view[0].style.top = curPosition + 'px';
        curPosition += holder.view.height();
        holderPositon++;
        if (holderPositon > this.holderStack.length - 1) {
          holderPositon = this.holderStack.length - 1;
        }
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
        var holder = this.createViewHolder();
        if (reverse) {
          this.holderStack.unshift(holder);
        } else {
          this.holderStack.push(holder);
        }
        return holder;
      }
      var holder = this.holderCache.pop();
      if (reverse) {
        this.holderStack.unshift(holder);
      } else {
        this.holderStack.push(holder);
      }
      holder.view[0].style.display = '';
      holder._height = 0;
      holder._data = null;
      holder._index = -1;
      return holder;
    };

    this.createViewHolder = function () {
      console.log("cerate new viewholder ============");
      var view = $(this.itemTempl);
      var holder = this.handle.createViewHolder(view);
      holder.view = view;
      this.root.append(holder.view);
      holder.view[0].style.position = 'absolute';
      holder.view[0].style.left = this.itemLeftOffset + 'px';
      holder.view[0].style.width = this.itemWidth + 'px';
      holder._index = -1;
      holder._height = 0;
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

    this.countStartIndexAndCurPosition = function (curPosition) {
      var result = {'start':0, 'curPosition': this.itemTopOffset};
      if (curPosition < this.windowHeight || this.datas.length < 200) {
        return result;
      }
      if (this.holderCache.length < 300) {
        var holder = this.createViewHolder();
        holder.view[0].style.display = 'none';
        this.holderCache.push(holder);
      }
      for (var i = 0; i < this.datas.length; ) {
        for (var j = 0; j < this.holderCache.length && i < this.datas.length; j++, i++) {
          var data = this.datas[i];
          var holder = this.holderCache[j];
          this.handle.bindData(i, holder, data);
        }
        for (var j = 0; j < this.holderCache.length; j++) {
          var holder = this.holderCache[j];
          result.curPosition += holder.view.height();
          result.start++;
          if (result.curPosition - this.scrollTop > this.overflowHeight) {
            return result;
          }
          if (result.start > this.datas.length - 200) {
            return result;
          }
        }
      }
    }

    this.addBottomLayout = function () {
      this.bottomLayout = $('<div></div>');
      this.root.append(this.bottomLayout);
      this.bottomLayout[0].style.position = 'absolute';
      this.bottomLayout[0].style.top = '0px';
      this.bottomLayout[0].style.width = '1px';
      this.bottomLayout[0].style.height = '1px';
    };
    this.addBottomLayout();

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

      this.holderCache = this.holderCache.concat(topArr).concat(bottomArr);

      topArr.forEach(function (holder) {
        holder.view[0].style.display = 'none';
      });
      bottomArr.forEach(function (holder) {
        holder.view[0].style.display = 'none';
      });

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

    this.scroll = function (event) {

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
