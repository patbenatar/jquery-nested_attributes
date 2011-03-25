(function($) {

	$.fn.nestedAttributes = function (options) {


    ////////////////////
    //                //
    // Initialization //
    //                //
    ////////////////////

    if ($(this).length > 1) throw "Can't initialize more than one item at a time";

    // This	plugin gets called on the container
		var $container = $(this);
		
		// Merge default options
		options = $.extend({}, settings, options);

    // If the user provided a jQuery object to bind the "Add"
    // bind it now or forever hold your piece.
		if (options.bindAddTo) options.bindAddTo.click(addClick);

    // Cache all the items
		var $items = $container.children();
			
		// Initialize existing items
		$items.each(function (i) {
			
      var $item = $(this);

      // If the user wants us to attempt to collect Rail's ID attributes, do it now
      // Using the default rails helpers, ID attributes will wind up right after their 
      // propper containers in the form.
			if (options.collectIdAttributes && $item[0].nodeName == 'INPUT') {
        // Move the _id field into its proper container
        $item.appendTo($item.prev());
        // Remove it from the $items collection
        $items = $items.not($item);
			}

      // Try to find and bind the destroy link if the user wanted one
      bindDestroy($item);
			
		});

    // Cache a clone
    var $clone = extractClone();
		
		// Remove any items on load if the client implements a check and the check passes
		if (options.removeOnLoadIf) {
			
			$items.each(function (i) {

				if ($(this).call(true, options.removeOnLoadIf, i)) {

					$(this).remove();
					
				}
				
			});
			
		}


    ///////////////////////
    //                   //
    // Support functions //
    //                   //
    ///////////////////////

    function addClick (event) {

      // Piece together an item
      var $newClone = $clone.clone(true);
      var newIndex = $container.children().length;
      $clone = applyIndexToItem($newClone, newIndex);

      // Give the user a chance to make their own changes before we insert
      if (options.beforeAdd) $newClone.call(options.beforeAdd, newIndex);

      // Insert the new item
      $container.append($newClone);

      // Give the user a chance to make their own chances after insertion
      if (options.afterAdd) $newClone.call(options.afterAdd, newIndex);

      // Remove this item from the items list
      refreshItems();

      // Don't let the link do anything
      event.preventDefault();
      
    }
    
    
    function extractClone () {
      
      // Make a deep clone (bound events and data)
      var $record = $items.first().clone(true);
      
      // Empty out the values 
      $record.find(':input').val('');
      
      return $record;
      
    }
    
    
    function applyIndexToItem ($item, index) {
      
      var collectionName = options.collectionName;

      $item.find(':input').each(function () {
        
        var idRegExp = new RegExp('_' + collectionName + '_attributes_\\d+_');
        var idReplacement = '_' + collectionName + '_attributes_' + index + '_';
        var nameRegExp = new RegExp('\\[' + collectionName + '_attributes\\]\\[\\d+\\]');
        var nameReplacement = '[' + collectionName + '_attributes][' + index + ']';
        
        var newID = $(this).attr('id').replace(idRegExp, idReplacement);
        var newName = $(this).attr('name').replace(nameRegExp, nameReplacement);
        
        $(this).attr({
          id: newID,
          name: newName
        });			
        
      });
      
      $item.find('label').each(function () {
        
        var forRegExp = new RegExp('_' + collectionName + '_attributes_\\d+_');
        var forReplacement = '_' + collectionName + '_attributes_' + index + '_';
        var newFor = $(this).attr('for').replace(forRegExp, forReplacement);
        $(this).attr('for', newFor);
        
      });
      
      return $item;
      
    }
    
    
    // Hides a item from the user and marks it for deletion in the
    // DOM by setting _destroy to true if the record already exists. If it
    // is a new escalation, we simple delete the item
    function destroyClick (event) {

      var $item = $(this).parentsUntil($container.selector).last();
      var index = indexForItem($item);
      var itemIsNew = $item.find('input[name$="\\[id\\]"]').length == 0;

      if (options.beforeDestroy) $item.call(options.beforeDestroy, index, itemIsNew);

      if (itemIsNew) {

        $item.remove();

      } else {

        // Hide the item
        $item.hide();

        // Add the _destroy field
        var otherFieldName = $item.find(':input:first').attr('name');
        var attributePosition = otherFieldName.lastIndexOf('[');
        var destroyFieldName = otherFieldName.substring(0, attributePosition) + '[_destroy]';
        var $destroyField = $('<input type="hidden" name="' + destroyFieldName + '" />');
        $item.append($destroyField);
        $destroyField.val(true).change();

      }

      if (options.afterDestroy) $item.call(options.afterDestroy, index, itemIsNew);

      // Remove this item from the items list
      refreshItems();

      // Rename the remaining items
      resetIndexes();

      event.preventDefault();

    }
    
    
    function indexForItem ($item) {

      var regExp = new RegExp('\\[' + options.collectionName + '_attributes\\]\\[\\d+\\]');
      var name = $item.find(':input:first').attr('name');
      return parseInt(name.match(regExp)[0].split('][')[1].slice(0, -1), 10);
      
    }


    function refreshItems () {

      $items = $container.children();

    }
    

    // Sets the proper association indices and labels to all items
    // Used when removing items
    function resetIndexes () {
      
      $items.each(function (index) {

        // Make sure this is actually a new position
        var oldIndex = indexForItem($(this));
        if (index == oldIndex) return true;
      
        if (options.beforeMove) $(this).call(options.beforeMove, index, oldIndex);
      
        // Change the number to the new index
        applyIndexToItem($(this), index);

        if (options.afterMove) $(this).call(options.afterMove, index, oldIndex);
        
      });
          
    }

    function bindDestroy ($item) {

      if (options.destroySelector) {

        $item.find(options.destroySelector).click(destroyClick);

      }

    }


    ////////////
    //        //
    // Return //
    //        //
    ////////////

		return $(this);
		
	};
	
	
	var settings = {
		removeEmptyOnLoad: false,
		collectionName: false,
		bindAddTo: false,
		removeOnLoadIf: false,
		collectIdAttributes: true,
		detectCollectionName: true,
		beforeAdd: false,
		afterAdd: false,
		beforeMove: false,
		afterMove: false,
		beforeDestroy: false,
		afterDestroy: false,
    autoAdd: false,
    destroySelector: '.destroy'
	};
	
	
	
	
})(jQuery);
