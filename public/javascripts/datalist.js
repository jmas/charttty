(function(window) {
  var document = window.document;

  var DataList = function(el, data, itemTpl, populateItemDataFn, beforeUpdateFn, afterUpdateFn) {
    if (! (el instanceof Node)) {
      throw new Error('el should be an Node.');
    }
    if (! (data instanceof Array)) {
      throw new Error('data should be an Array.');
    }
    if (typeof itemTpl !== 'string') {
      throw new Error('itemTpl should be an String.');
    }
    if (typeof populateItemDataFn !== 'undefined' && ! (populateItemDataFn instanceof Function)) {
      throw new Error('populateItemDataFn should be an Function.');
    }
    if (typeof beforeUpdateFn !== 'undefined' && ! (beforeUpdateFn instanceof Function)) {
      throw new Error('beforeUpdateFn should be an Function.');
    }
    if (typeof afterUpdateFn !== 'undefined' && ! (afterUpdateFn instanceof Function)) {
      throw new Error('afterUpdateFn should be an Function.');
    }
    this.el = el;
    this.data = data;
    this.itemTpl = itemTpl;
    this.populateItemDataFn = populateItemDataFn || null;
    this.beforeUpdateFn = beforeUpdateFn || null;
    this.afterUpdateFn = afterUpdateFn || null;
    this.render();
  };

  DataList.prototype = {
    el: null,
    itemTpl: '',
    data: [],
    populateItemDataFn: null,
    beforeUpdateFn: null,
    afterUpdateFn: null,
    dummyTagName: 'DIV',
    emptyTpl: '<div>List is empty.</div>',
    render: function() {
      if (! this.el) {
        return;
      }
      this.el.innerHTML = '';
      if (this.data.length === 0) {
        this.el.innerHTML = this.emptyTpl;
      } else {
        for (var i=0,ln=this.data.length; i<ln; i++) {
          this.el.appendChild(this.makeItemEl(this.data[i]));
        }
      }
    },
    update: function(data) {
      if (! (data instanceof Array)) {
        throw new Error('data should be an Array.');
      }
      this.data = data;
      if (this.beforeUpdateFn) {
        this.beforeUpdateFn.call(this);
      }
      this.render();
      if (this.afterUpdateFn) {
        this.afterUpdateFn.call(this);
      }
    },
    makeItemEl: function(itemData) {
      var itemEl = document.createElement(this.dummyTagName);
      itemEl.innerHTML = this.itemTpl;
      if (itemEl.firstElementChild) {
        itemEl = itemEl.firstElementChild;
      }
      if (this.populateItemDataFn) {
        this.populateItemDataFn(itemEl, itemData);
      }
      return itemEl;
    },
    setEmptyTpl: function(tpl) {
      this.emptyTpl = tpl;
      this.render();
    }
  };

  // export
  window['DataList'] = DataList;
})(this);
