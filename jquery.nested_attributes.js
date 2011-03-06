(function($) {

	$.fn.nestedAttributes = function (options) {
		
		var $this = $(this).first();
		
		// Merge default options
		options = $.extend({}, settings, options);
		
		if (options.bindAddTo) {
			
			// Bind the add click
			options.bindAddTo.click(addClick);
		
			// Save the collection in the add button
			options.bindAddTo.data('collection', $this);
			
		}
		
		var $children = $this.children();
			
		// Initialize existing rows
		$children.each(function (i) {
			
			if (options.collectIdAttributes) {
				// Using the default rails helpers, ID attributes will wind up
				// right after their propper containers in the form.
				if ($(this)[0].nodeName == 'INPUT') {
          $(this).appendTo($(this).prev());
          $children = $children.not($(this));
        }

			}
			
			var $destroyLink = $(this).find('.destroy');
			$destroyLink.click(destroyClick);
			$destroyLink.data('row', $(this));
			$(this).data('collection', $this);
			
		});
		
		// Store a clone of one of the collection
		$this.data({
			clone: extractClone($children),
			options: options
		});
		
		// Remove any rows on load if the client implements a check
		// and the check passes
		if (options.removeOnLoadIf) {
			
			$children.each(function (i) {

				if ($(this).call(true, options.removeOnLoadIf, i)) {

					$(this).remove();
					
				}
				
			});
			
		}
		
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
		afterDestroy: false
	};
	
	
	function addClick (event) {
		
		var $collection = $(this).data('collection');
		var $clone = $collection.data('clone').clone(true);
		var beforeAdd = $collection.data('options').beforeAdd;
		var afterAdd = $collection.data('options').afterAdd;
		var newIndex = $collection.children().length;

		$clone = applyIndexToRow($clone, newIndex);
		
		$clone.find('.destroy').data('row', $clone);
		
		if (beforeAdd) $clone.call(beforeAdd, newIndex);
		
		$collection.append($clone);
		
		if (afterAdd) $clone.call(afterAdd, newIndex);
		
		event.preventDefault();
		
	}
	
	
	function extractClone ($collection) {
		
		// Make a deep clone (bound events and data)
		var $record = $collection.first().clone(true);
		
		// Empty out the values 
		$record.find(':input').val('');
		
		return $record;
		
	}
	
	
	function applyIndexToRow ($row, index) {
		
		var $inputs = $row.find(':input');
		var options = $row.data('collection').data('options');
		var collectionName = options.collectionName;

		$inputs.each(function () {
			
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
		
		return $row;
		
	}
	
	
	// Hides a row from the user and marks it for deletion in the
	// DOM by setting _destroy to true if the record already exists. If it
	// is a new escalation, we simple delete the row
	function destroyClick (event) {

		var $row = $(this).data('row');
		var $collection = $row.data('collection');
		var index = indexForRow($row);

		var beforeDestroy = $collection.data('options').beforeDestroy;
		if (beforeDestroy) $row.call(beforeDestroy, index, isNew($row));

		if (isNew($row)) {

			$row.remove();

		} else {

			// Hide the row
			$row.hide();

			// Add the _destroy field
			var otherFieldName = $row.find(':input:first').attr('name');
			var attributePosition = otherFieldName.lastIndexOf('[');
			var destroyFieldName = otherFieldName.substring(0, attributePosition) + '[_destroy]';
			var $destroyField = $('<input type="hidden" name="' + destroyFieldName + '" />');
			$(this).after($destroyField);
			$destroyField.val(true).change();

		}

		var afterDestroy = $collection.data('options').afterDestroy;
		if (afterDestroy) $row.call(afterDestroy, index, isNew($row));

		// Rename the remaining escalations
		resetIndexes($collection);

		event.preventDefault();

	}
	
	
	function indexForRow ($row) {
		
		var options = $row.data('collection').data('options');
		var collectionName = options.collectionName;
		var regExp = new RegExp('\\[' + collectionName + '_attributes\\]\\[\\d+\\]');
		var name = $row.find(':input:first').attr('name');
		return parseInt(name.match(regExp)[0].split('][')[1].slice(0, -1), 10);
		
	}
	
	
	function isNew ($row) {

		return $row.find('input[name$="\\[id\\]"]').length == 0;
		
	}
	

	// Sets the proper association indices and labels to all rows
	// Used when removing escalations	
	function resetIndexes ($collection) {
		
		$collection.children().each(function (index) {

			// Make sure this is actually a new position
			var oldIndex = indexForRow($(this));
			if (index == oldIndex) return true;
		
			var beforeMove = $collection.data('options').beforeMove;
			if (beforeMove) $(this).call(beforeMove, index, oldIndex);
		
			// Change the number to the new index
			applyIndexToRow($(this), index);

			var afterMove = $collection.data('options').afterMove;
			if (afterMove) $(this).call(afterMove, index, oldIndex);
			
		});
				
	}
	
	
})(jQuery);
