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
      destroySelector: '.destroy'
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
      this.$clone = this.extractClone();
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
        match = pattern.exec(this.$items.first().find(':input:first').attr('name'))[1];
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
      var $el, $newClone, newIndex;
      $el = $(event.target);
      $newClone = this.$clone.clone(true);
      newIndex = this.$container.children().length;
      this.$clone = this.applyIndexToItem($newClone, newIndex);
      if (this.options.beforeAdd) {
        $newClone.call(this.options.beforeAdd, newIndex);
      }
      this.$items.last().after($newClone);
      if (this.options.afterAdd) {
        $newClone.call(this.options.afterAdd, newIndex);
      }
      this.refreshItems();
      return event.preventDefault();
    };
    NestedAttributes.prototype.extractClone = function() {
      var $record;
      $record = this.$items.first().clone(true);
      $record.find(':input').val('');
      return $record;
    };
    NestedAttributes.prototype.applyIndexToItem = function($item, index) {
      var collectionName;
      collectionName = this.options.collectionName;
      $item.find(':input').each(__bind(function(i, el) {
        var $el, idRegExp, idReplacement, nameRegExp, nameReplacement, newID, newName;
        $el = $(el);
        idRegExp = new RegExp("_" + collectionName + "_attributes_\\d+_");
        idReplacement = "_" + collectionName + "_attributes_" + index + "_";
        nameRegExp = new RegExp("\\[" + collectionName + "_attributes\\]\\[\\d+\\]");
        nameReplacement = "[" + collectionName + "_attributes][" + index + "]";
        newID = $el.attr('id').replace(idRegExp, idReplacement);
        newName = $el.attr('name').replace(nameRegExp, nameReplacement);
        return $el.attr({
          id: newID,
          name: newName
        });
      }, this));
      $item.find('label').each(__bind(function(i, el) {
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
      $el = $(event.target);
      $item = $el.parentsUntil(this.$container.selector).last();
      index = indexForItem($item);
      itemIsNew = $item.find('input[name$="\\[id\\]"]').length === 0;
      if (this.options.beforeDestroy) {
        $item.call(this.options.beforeDestroy, index, itemIsNew);
      }
      if (itemIsNew) {
        $item.remove();
      } else {
        $item.hide();
        otherFieldName = $item.find(':input:first').attr('name');
        attributePosition = otherFieldName.lastIndexOf('[');
        destroyFieldName = "" + (otherFieldName.substring(0, attributePosition)) + "[_destroy]";
        $destroyField = $("<input type=\"hidden\" name=\"" + destroyFieldName + "\" />");
        $item.append($destroyField);
        $destroyField.val(true).change();
      }
      if (this.options.afterDestroy) {
        $item.call(this.options.afterDestroy, index, itemIsNew);
      }
      this.refreshItems();
      this.resetIndexes();
      return event.preventDefault();
    };
    NestedAttributes.prototype.indexForItem = function($item) {
      var name, regExp;
      regExp = new RegExp("\\[" + this.options.collectionName + "_attributes\\]\\[\\d+\\]");
      name = $item.find(':input:first').attr('name');
      return parseInt(name.match(regExp)[0].split('][')[1].slice(0, -1), 10);
    };
    NestedAttributes.prototype.refreshItems = function() {
      return this.$items = this.$container.children();
    };
    NestedAttributes.prototype.resetIndexes = function() {
      return $items.each(__bind(function(i, el) {
        var $el, oldIndex;
        $el = $(el);
        oldIndex = indexForItem($el);
        if (i === oldIndex) {
          return true;
        }
        if (this.options.beforeMove) {
          $el.call(this.options.beforeMove, index, oldIndex);
        }
        this.applyIndexToItem($el, index);
        if (this.options.afterMove) {
          return $el.call(this.options.afterMove, index, oldIndex);
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
