# DOMEvents

<!-- RM-IGNORE -->
## Table of contents
<!-- /RM-IGNORE -->
<!-- RM(tree:*) -->

[Got to top](/README.md)

* [Listen to events](#listen-to-events)
* [Get bound context](#get-bound-context)
* [Unbind event](#unbind-event)


<!-- /RM -->

## Listen to events

```javascript
lackey.bind('saveBnt','click', (event) => {
    console.log(event);
});
```

## Get bound context

Where `bind context` is elemet you bound event to, not event taret

```javascript
lackey.bind('saveBnt','click', (event, hook) => {
    console.log(hook);
});
```

## Unbind event

Where `bind context` is elemet you bound event to, not event taret

```javascript
lackey.bind('saveBnt','click', (event, hook, unbind) => {
    unbind();
});
```
