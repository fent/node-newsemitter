const NewsEmitter = require('..');
const assert      = require('assert');


describe('NEWS Emitter', () => {
  const news = new NewsEmitter();
  const results1 = [];
  const results2 = [];

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

    assert.deepEqual(results1, [
      { title: 'hello there' },
      { title: 'hello world' },
      { title: 'hey' }
    ]);
  });

  it('Keeps different history for each event', () => {
    assert.ok(news.emit('bar', { so: 'lucky' }));
    assert.ok(news.emit('bar', { so: { so: 'lucky' } }));
    assert.ok(!news.emit('bar', { so: 'lucky' }));
    assert.ok(!news.emit('bar', { so: { so: 'lucky' } }));
    assert.ok(news.emit('bar', { title: 'hello world' }));
    assert.ok(!news.emit('bar', { title: 'hello world' }));

    assert.deepEqual(results2, [
      { so: 'lucky' },
      { so: { so: 'lucky' } },
      { title: 'hello world' }
    ]);
  });
});


describe('Filter events', () => {
  const news = new NewsEmitter({ filter: ['live', 'forever'] });
  const results1 = [];
  const results2 = [];
  const results3 = [];

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

    assert.deepEqual(results1, [
      ['a', 'b', undefined],
      ['a', 'b', 'c'],
      ['foo', undefined, undefined]
    ]);

    assert.deepEqual(results2, [
      ['a', 'b', undefined],
      [1, 2, 3]
    ]);

    assert.deepEqual(results3, ['foo', 'foo', 'foo']);
  });
});


describe('Custom identifier', () => {
  const news = new NewsEmitter({
    history: 50,
    identifier: a => /^foo/.test(a[0]),
  });
  const results1 = [];
  const results2 = [];

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
  it('Is able to compare to history items we give it', () => {
    const news = new NewsEmitter();
    const results1 = [];

    news.on('foo', (a) => {
      results1.push(a);
    });

    news.addHistory('foo', [['hello'], ['hello world']]);

    news.emit('foo', 'a');
    news.emit('foo', 'hello world');
    news.emit('foo', 'hello');
    news.emit('foo', 'a');

    assert.deepEqual(results1, ['a']);

    news.addHistory('foo', [['b'], ['c']]);

    news.emit('foo', 'a');
    news.emit('foo', 'b');
    news.emit('foo', 'c');
    news.emit('foo', 'hello world');
    news.emit('foo', 'hello');
    news.emit('foo', 'indescrivable');

    assert.deepEqual(results1, ['a', 'indescrivable']);
  });
});
