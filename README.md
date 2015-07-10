# jQuery plugin for Rails Nested Attributes

jQuery plugin that makes it easy to dynamically add and remove records when using ActiveRecord's nested attributes.

## Installation w/ Rails asset pipeline

1. Download your flavor of jquery.nested_attributes (JS or Coffee)
2. Add it to vendor/assets/javascripts
3. Include it in your app's JS manifest

## Usage

### Markup

```html
<div id="container">
  <%= form.fields_for :collection do |collection_fields| %>
    <div>
      <%= collection_fields.label :field_name %>
      <%= collection_fields.text_field :field_name %>
      <a href="#" class="destroy">×</a>
    </div>
  <% end %>
</div>
<a href="#" id="add_another">+ add another</a>
```

All immediate descendants of #container (children) will be considered sets of
nested attributes. Don't add anything else as immediate descendents.

### JavaScript (in its simplest form)

```javascript
$("#container").nestedAttributes({
  bindAddTo: $("#add_another")
});
```

## Options (defaults shown)

```javascript
{
  collectionName: false,         // If not provided, we will attempt to autodetect. Provide this for complex collection names
  bindAddTo: false,              // Required unless you are implementing your own add handler (see API below). The single DOM element that when clicked will add another set of fields
  removeOnLoadIf: false,         // Function. It will be called for each existing item, return true to remove that item
  collectIdAttributes: true,     // Attempt to collect Rail's ID attributes
  beforeAdd: false,              // Function. Callback before adding an item. Returning false from the callback stops the add process.
  afterAdd: false,               // Function. Callback after adding an item
  beforeMove: false,             // Function. Callback before updating indexes on an item
  afterMove: false,              // Function. Callback after updating indexes on an item
  beforeDestroy: false,          // Function. Callback before destroying an item. Returning false from the callback stops the destroy process.
  afterDestroy: false,           // Function. Callback after destroying an item
  destroySelector: '.destroy',   // Pass in a custom selector of an element in each item that will destroy that item when clicked
  deepClone: true,               // Do you want jQuery to deep clone the element? Deep clones preserve events. Undesirable when using BackBone views for each element.
  $clone: null                   // Pass in a clean element to be used when adding new items. Useful when using plugins like jQuery UI Datepicker or Select2. Use in conjunction with `afterAdd`.
}
```

### Example of a helpful beforeDestroy callback to prevent destroy

```javascript
$("#container").nestedAttributes({
  bindAddTo: $("#add_another"),
  beforeDestroy: function() {
    return confirm("Are you sure?");
  }
});
```

## API

### Adding an item

Should you need to add an item programmatically (rather than when the user clicks
the bindAddTo element), jquery.nestedAttributes exposes an add method for this.

Optionally pass a callback as the second parameter for easy access to the
newly added element after its been inserted into the DOM.

```javascript
$('#container').nestedAttributes("add" [, callback($element)]);
```

## Credits

### Contributors

* [Brendan Loudermilk](https://github.com/bloudermilk)
* [Nick Giancola](https://github.com/patbenatar)
* [Alec Winograd](https://github.com/awinograd)
* [lulalala](https://github.com/lulalala)

### Sponsor

[![philosophie](http://patbenatar.github.io/showoff/images/philosophie.png)](http://gophilosophie.com)
