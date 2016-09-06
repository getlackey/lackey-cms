# Coding Standards

## JavaScript

### const, var, let

```javascript
const
  a = require('a'),
  b = require('b');
  
// or if single
let b = 1;
```

### Brackets

```javascript
function() { // no enter here
  // empty line
  // ...
}
```


### Arrow functions

```javascript

const
  a = b => b + 1,
  c = (b, d) => b + d,
  f = z => {
  
    console.log(z);
  };
```

### Chains

```javascript

return Promise
  .all(collection
    .map(a => a + 1))
  .then(c => doSomething(c));

```
