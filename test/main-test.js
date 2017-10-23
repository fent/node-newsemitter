const NewsEmitter = require('..');
const assert      = require('assert');


describe('NEWS Emitter', () => {
  var news = new NewsEmitter();
  var results1 = [];
  var results2 = [];

  news.on('foo', (item) => {
    results1.push(item);
  });

  news.on('bar', (item) => {
    results2.push(item);
  });

  it('Should not emit old items', () => {
    assert.ok(news.emit('foo', { title: 'hello there' }));
    assert.ok(news.emit('foo', { title: 'hello world' }));
    assert.ok(!news.emit('foo', { title: 'hello there' }));
    assert.ok(news.emit('foo', { title: 'hey' }));
    assert.ok(!news.emit('foo', { title: 'hey' }));
    assert.ok(!news.emit('foo', { title: 'hey' }));

    var expected = [
      { title: 'hello there' },
      { title: 'hello world' },
      { title: 'hey' }
    ];
    assert.deepEqual(results1, expected);
  });

  it('Keeps different history for each event', () => {
    assert.ok(news.emit('bar', { so: 'lucky' }));
    assert.ok(news.emit('bar', { so: { so: 'lucky' } }));
    assert.ok(!news.emit('bar', { so: 'lucky' }));
    assert.ok(!news.emit('bar', { so: { so: 'lucky' } }));
    assert.ok(news.emit('bar', { title: 'hello world' }));
    assert.ok(!news.emit('bar', { title: 'hello world' }));

    var expected = [
      { so: 'lucky' },
      { so: { so: 'lucky' } },
      { title: 'hello world' }
    ];
    assert.deepEqual(results2, expected);
  });
});


describe('Filter events', () => {
  var news = new NewsEmitter({ filter: ['live', 'forever'] });
  var results1 = [];
  var results2 = [];
  var results3 = [];

  news.on('live', (a, b, c) => {
    results1.push([a, b, c]);
  });

  news.on('forever', (a, b, c) => {
    results2.push([a, b, c]);
  });

  news.on('item', (item) => {
    results3.push(item);
  });

  it('Only filtered events are kept in history', () => {
    news.emit('live', 'a', 'b');
    news.emit('forever', 'a', 'b');
    news.emit('live', 'a', 'b', 'c');
    news.emit('live', 'foo');
    news.emit('live', 'foo');

    news.emit('item', 'foo');
    news.emit('item', 'foo');
    news.emit('item', 'foo');

    news.emit('forever', 'a', 'b');
    news.emit('forever', 1, 2, 3);

    var expected1 = [
      ['a', 'b', undefined],
      ['a', 'b', 'c'],
      ['foo', undefined, undefined]
    ];
    assert.deepEqual(results1, expected1);

    var expected2 = [
      ['a', 'b', undefined],
      [1, 2, 3]
    ];
    assert.deepEqual(results2, expected2);

    var expected3 = ['foo', 'foo', 'foo'];
    assert.deepEqual(results3, expected3);
  });
});


describe('Custom identifier', () => {
  var news = new NewsEmitter({
    history: 50,
    identifier: a => /^foo/.test(a[1]),
  });
  var results1 = [];
  var results2 = [];

  news.on('foo', (item) => {
    results1.push(item);
  });

  news.on('bar', (item) => {
    results2.push(item);
  });

  it('Emits only items with different identifiers', () => {
    news.emit('foo', 'what');
    news.emit('foo', 'what');
    news.emit('foo', 'butt');
    news.emit('foo', 'butt');
    news.emit('foo', 'foo');

    news.emit('bar', 'foo');
    news.emit('bar', 'foo2');
    news.emit('bar', 'foo fighters');
    news.emit('bar', 'foo something');
    news.emit('bar', 'oh foo');

    assert.deepEqual(results1, ['what', 'foo']);
    assert.deepEqual(results2, ['foo', 'oh foo']);
  });
});


describe('Self manage history', () => {
  var news = new NewsEmitter();
  var results1 = [];

  news.on('foo', (a) => {
    results1.push(a);
  });

  it('Is able to compare to history items we give it', () => {
    news.addHistory('foo', [
      { 0: 'foo', 1: 'hello' },
      { 0: 'foo', 1: 'hello world' }
    ]);

    news.emit('foo', 'a');
    news.emit('foo', 'hello world');
    news.emit('foo', 'hello');
    news.emit('foo', 'a');

    assert.deepEqual(results1, ['a']);

    news.addHistory('foo', [
      { 0: 'foo', 1: 'b' },
      { 0: 'foo', 1: 'c' }
    ]);

    news.emit('foo', 'a');
    news.emit('foo', 'b');
    news.emit('foo', 'c');
    news.emit('foo', 'hello world');
    news.emit('foo', 'hello');
    news.emit('foo', 'indescrivable');

    assert.deepEqual(results1, ['a', 'indescrivable']);
  });
});
