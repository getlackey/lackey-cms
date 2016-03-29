# Hooks

<!-- RM-IGNORE -->
## Table of contents
<!-- /RM-IGNORE -->
<!-- RM(tree:*) -->

[Got to top](/README.md)

* [Find elements by hook](#find-elements-by-hook)
* [Apply callback on all elements with hook](#apply-callback-on-all-elements-with-hook)


<!-- /RM -->

## Find elements by hook

In document

```html
<ul>
    <li>A</li>
    <li data-lky-hook="even">B</li>
    <li>C</li>
    <li data-lky-hook="even"D</li>
</ul>
```

Code

```javascript
var list = lackey.hooks('even');

```

Will result in

```javascript
[
    HTMLElement('<li data-lky-hook="even">B</li>'),
    HTMLElement('<li data-lky-hook="even">D</li>')
] // Array, not NodeList
```
## Apply callback on all elements with hook

```javascript
lackey.each('even', (hook) => {
    ...
});
```
