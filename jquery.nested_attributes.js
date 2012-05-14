(function() {
  var $, NestedAttributes;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  $ = jQuery;
  $.fn.extend({
    nestedAttributes: function(options) {
      if ($(this).length > 1) {
        throw "Can't initialize more than one item at a time";
      }
      return new NestedAttributes($(this), options);
    }
  });
  NestedAttributes = (function() {
    NestedAttributes.prototype.settings = {
      removeEmptyOnLoad: false,
      collectionName: false,
      bindAddTo: false,
      removeOnLoadIf: false,
      collectIdAttributes: true,
      beforeAdd: false,
      afterAdd: false,
      beforeMove: false,
      afterMove: false,
      beforeDestroy: false,
      afterDestroy: false,
      autoAdd: false,
      destroySelector: '.destroy',
      deepClone: true
    };
    function NestedAttributes($el, options) {
      this.destroyClick = __bind(this.destroyClick, this);
      this.addClick = __bind(this.addClick, this);      this.$container = $el;
      this.options = $.extend({}, this.settings, options);
      if (this.options.bindAddTo) {
        this.options.bindAddTo.click(this.addClick);
      }
      this.$items = this.$container.children();
      if (!this.options.collectionName) {
        this.autodetectCollectionName();
      }
      this.$items.each(__bind(function(i, el) {
        var $item;
        $item = $(el);
        if (this.options.collectIdAttributes && $item.is('input')) {
          $item.appendTo($item.prev());
          this.$items = this.$items.not($item);
        }
        return this.bindDestroy($item);
      }, this));
      if (this.options.removeOnLoadIf) {
        this.$items.each(__bind(function(i, el) {
          $el = $(el);
          if ($el.call(true, this.options.removeOnLoadIf, i)) {
            return $el.remove();
          }
        }, this));
      }
    }
    NestedAttributes.prototype.autodetectCollectionName = function() {
      var match, pattern;
      pattern = /\[(.[^\]]*)_attributes\]/;
      try {
        match = pattern.exec(this.$items.first().find(':input[name]:first').attr('name'))[1];
        if (match !== null) {
          return this.options.collectionName = match;
        } else {
          throw "Regex error";
        }
      } catch (error) {
        return console.log("Error detecting collection name", error);
      }
    };
    NestedAttributes.prototype.addClick = function(event) {
      this.addItem();
      return event.preventDefault();
    };
    NestedAttributes.prototype.addItem = function() {
      var $newClone, newIndex;
      newIndex = this.$items.length;
      $newClone = this.applyIndexToItem(this.extractClone(), newIndex);
      if (this.options.beforeAdd) {
        this.options.beforeAdd.call(void 0, $newClone, newIndex);
      }
      this.$container.append($newClone);
      if (this.options.afterAdd) {
        this.options.afterAdd.call(void 0, $newClone, newIndex);
      }
      return this.refreshItems();
    };
    NestedAttributes.prototype.extractClone = function() {
      var $record;
      if (this.$restorableClone) {
        $record = this.$restorableClone;
        this.$restorableClone = null;
      } else {
        $record = this.$items.first().clone(this.options.deepClone);
        if (!this.options.deepClone) {
          this.bindDestroy($record);
        }
        $record.find(':input').val('');
        $record.find(':checkbox, :radio').attr("checked", false);
        $record.find('input[name$="\\[id\\]"]').remove();
        $record.find('input[name$="\\[_destroy\\]"]').remove();
      }
      return $record.show();
    };
    NestedAttributes.prototype.applyIndexToItem = function($item, index) {
      var collectionName;
      collectionName = this.options.collectionName;
      $item.find(':input[name]').each(__bind(function(i, el) {
        var $el, idRegExp, idReplacement, nameRegExp, nameReplacement, newID, newName;
        $el = $(el);
        idRegExp = new RegExp("_" + collectionName + "_attributes_\\d+_");
        idReplacement = "_" + collectionName + "_attributes_" + index + "_";
        nameRegExp = new RegExp("\\[" + collectionName + "_attributes\\]\\[\\d+\\]");
        nameReplacement = "[" + collectionName + "_attributes][" + index + "]";
        if ($el.attr('id')) {
          newID = $el.attr('id').replace(idRegExp, idReplacement);
        }
        newName = $el.attr('name').replace(nameRegExp, nameReplacement);
        return $el.attr({
          id: newID,
          name: newName
        });
      }, this));
      $item.find('label[for]').each(__bind(function(i, el) {
        var $el, forRegExp, forReplacement, newFor;
        $el = $(el);
        try {
          forRegExp = new RegExp("_" + collectionName + "_attributes_\\d+_");
          forReplacement = "_" + collectionName + "_attributes_" + index + "_";
          newFor = $el.attr('for').replace(forRegExp, forReplacement);
          return $el.attr('for', newFor);
        } catch (error) {
          return console.log("Error updating label", error);
        }
      }, this));
      return $item;
    };
    NestedAttributes.prototype.destroyClick = function(event) {
      var $destroyField, $el, $item, attributePosition, destroyFieldName, index, itemIsNew, otherFieldName;
      if (!(this.$items.length - 1)) {
        this.$restorableClone = this.extractClone();
      }
      if (!(this.$items.filter(':visible').length - 1)) {
        this.addItem();
      }
      $el = $(event.target);
      $item = $el.parentsUntil(this.$container.selector).last();
      index = this.indexForItem($item);
      itemIsNew = $item.find('input[name$="\\[id\\]"]').length === 0;
      if (this.options.beforeDestroy) {
        this.options.beforeDestroy.call(void 0, $item, index, itemIsNew);
      }
      if (itemIsNew) {
        $item.remove();
      } else {
        $item.hide();
        otherFieldName = $item.find(':input[name]:first').attr('name');
        attributePosition = otherFieldName.lastIndexOf('[');
        destroyFieldName = "" + (otherFieldName.substring(0, attributePosition)) + "[_destroy]";
        $destroyField = $("<input type=\"hidden\" name=\"" + destroyFieldName + "\" />");
        $item.append($destroyField);
        $destroyField.val(true).change();
      }
      if (this.options.afterDestroy) {
        this.options.afterDestroy.call($item, index, itemIsNew);
      }
      this.refreshItems();
      this.resetIndexes();
      return event.preventDefault();
    };
    NestedAttributes.prototype.indexForItem = function($item) {
      var name, regExp;
      regExp = new RegExp("\\[" + this.options.collectionName + "_attributes\\]\\[\\d+\\]");
      name = $item.find(':input[name]:first').attr('name');
      return parseInt(name.match(regExp)[0].split('][')[1].slice(0, -1), 10);
    };
    NestedAttributes.prototype.refreshItems = function() {
      return this.$items = this.$container.children();
    };
    NestedAttributes.prototype.resetIndexes = function() {
      return this.$items.each(__bind(function(i, el) {
        var $el, oldIndex;
        $el = $(el);
        oldIndex = this.indexForItem($el);
        if (i === oldIndex) {
          return true;
        }
        if (this.options.beforeMove) {
          this.options.beforeMove.call($el, i, oldIndex);
        }
        this.applyIndexToItem($el, i);
        if (this.options.afterMove) {
          return this.options.afterMove.call($el, i, oldIndex);
        }
      }, this));
    };
    NestedAttributes.prototype.bindDestroy = function($item) {
      if (this.options.destroySelector) {
        return $item.find(this.options.destroySelector).click(this.destroyClick);
      }
    };
    return NestedAttributes;
  })();
}).call(this);
