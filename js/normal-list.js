var NormalList = (function () {
  function NormalList(root_) {
    this.root = root_;

    this.itemTempl = this.root.html();
    var item = this.root.find('.item');
    item.remove();

    this.handle = null;
    this.datas = [];

    this.setHandle = function (handle_) {
      this.handle = handle_;
    };

    this.setDatas = function (datas_) {
      this.root.html('');
      this.datas = datas_;
      this.updateList();
    };

    this.append = function (data_) {
      this.datas.push(data_);
      var i = this.datas.length - 1;
      var holder = this.getViewHolder(i);
      var data = this.datas[i];
      this.bindData(i, holder, data);
    };

    this.updateList = function () {
      for (var i = 0; i < this.datas.length; i++) {
        var holder = this.getViewHolder(i);
        var data = this.datas[i];
        this.bindData(i, holder, data);
      }
    };

    this.getViewHolder = function (index) {
        var holder = this.createViewHolder();
        return holder;
    };

    this.createViewHolder = function () {
      var view = $(this.itemTempl);
      var holder = this.handle.createViewHolder(view);
      holder.view = view;
      this.root.append(holder.view);
      return holder;
    };

    this.bindData = function(i, holder, data){
      this.handle.bindData(i, holder, data);
      holder._index = i;
      holder._data = data;
    };

  };

  return NormalList;
})();
