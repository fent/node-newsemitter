# node-newsemitter

An event emitter that emits only new events. Because sometimes we don't care about old events.

![Depfu](https://img.shields.io/depfu/fent/node-newsemitter)
[![codecov](https://codecov.io/gh/fent/node-newsemitter/branch/master/graph/badge.svg)](https://codecov.io/gh/fent/node-newsemitter)

# Usage

```js
const NewsEmitter = require('newsemitter');
const news = new NewsEmitter();

news.on('item', (item) => {
  console.log('new item:', item.title);
});

news.emit('item', { title: 'hello there' });
news.emit('item', { title: 'hello world' });
news.emit('item', { title: 'hello there' });
news.emit('item', { title: 'hey' });
news.emit('item', { title: 'hey' });
news.emit('item', { title: 'hey' });

// new item: hello there
// new item: hello world
// new item: hey
```

# API
### new NewsEmitter([options])

Creates an instance of a NewsEmitter. `options` can be

* `filter` - An array of events that will be affected. If not given, event names will not be filtered.
* `ignore` - An array of events that will be ignored. Defaults to `['newListener', 'removeListener']`.
* `maxHistory` - Maximum number of history items to remember. Default is `10`.
* `manageHistory` - If true, does not add emitted events to history. Instead expects you to manually manage history with `addHistory()`. Defaults to `false`.
* `identifier` - Function used to compare one event to another. Called with a list of arguments that `NewsEmitter#emit()` is called with, sans event name. Should return a string. Default is `JSON.stringify`.

### NewsEmitter#emit(event)

Emits an event, only if it has not been emitted before. Returns true if item is new and emtted. False otherwise.

### NewsEmitter#reset([event])

Resets history of an event. If no event given, resets all history.

### NewsEmitter#addHistory(event, arr)

Adds items in `arr` as `event`'s history. Truncated as necessary based on max history length considering the last item in the array as newest.


# Install

    npm install newsemitter


# Tests
Tests are written with [mocha](https://mochajs.org)

```bash
npm test
```
