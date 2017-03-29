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

    this.setHandle = function (handle_) {
      this.handle = handle_;
    };

    this.setDatas = function (datas_) {
      this.datas = datas_;
      this.updateList();
    };

    this.updateList = function () {
      console.log('updateList===============');
      for (var i = 0; i < datas.length; i++) {
        var holder = this.handle.createView(this.itemTempl);
        this.handle.bindData(i, holder, datas[i]);
        root.append(holder.view);
        console.log("view height : " + holder.view.height());
      }
    };

    this.log = function () {
      console.log('log begin =======================');
      console.dir(this.handle);
      console.dir(this.datas);
      console.log('log end =======================');
    };

    this.hodlerStack = [];
    this.itemHeight = 0;
    this.scroll = function (event) {
      console.log('onScroll '+ event+'   top  ' + $(window).scrollTop());
      // holder.view.offset().top
      // holder.view.height()
      // $(window).scrollTop();
      // $(window).height()
      // s.splice(0,1) 删除指定元素
      var windowHeight = $(window).height();
      var scrollTop = $(window).scrollTop();
      if (true) {

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
