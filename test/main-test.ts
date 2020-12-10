import NewsEmitter from '..';
import assert      from 'assert';


describe('NEWS Emitter', () => {
  it('Should not emit old items', () => {
    const news = new NewsEmitter();
    const results: {}[] = [];
    news.on('foo', (item: {}) => results.push(item));

    assert.ok(news.emit('foo', { title: 'hello there' }));
    assert.ok(news.emit('foo', { title: 'hello world' }));
    assert.ok(!news.emit('foo', { title: 'hello there' }));
    assert.ok(news.emit('foo', { title: 'hey' }));
    assert.ok(!news.emit('foo', { title: 'hey' }));
    assert.ok(!news.emit('foo', { title: 'hey' }));

    assert.deepEqual(results, [
      { title: 'hello there' },
      { title: 'hello world' },
      { title: 'hey' }
    ]);
  });

  it('Keeps different history for each event', () => {
    const news = new NewsEmitter();
    const results1: {}[] = [];
    const results2: {}[] = [];
    news.on('foo', (item: {}) => results1.push(item));
    news.on('bar', (item: {}) => results2.push(item));

    assert.ok(news.emit('foo', { so: 'lucky' }));
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

  it('Throws error with bad options', () => {
    assert.throws(() => {
      // @ts-ignore-next-line
      new NewsEmitter({ filter: { 'myevent': true } });
    }, /must be an array/);
    assert.throws(() => {
      // @ts-ignore-next-line
      new NewsEmitter({ ignore: 'myotherevent' });
    }, /must be an array/);
    assert.throws(() => {
      new NewsEmitter({ maxHistory: -10 });
    }, /must be a positive integer/);
    assert.throws(() => {
      // @ts-ignore-next-line
      new NewsEmitter({ identifier: 'keyes' });
    }, /must be a function/);
  });

  describe('`maxHistory` is reached', () => {
    it('Older events are emitted again', () => {
      const news = new NewsEmitter({ maxHistory: 1 });
      const results: number[] = [];
      news.on('aaa', (a: number) => results.push(a));

      news.emit('aaa', 4);
      news.emit('aaa', 5);
      news.emit('aaa', 7);
      news.emit('aaa', 4);
      news.emit('aaa', 4);
      news.emit('aaa', 4);
      news.emit('aaa', 4);
      news.emit('aaa', 4);
      assert.deepEqual(results, [4, 5, 7, 4]);
    });
  });

  describe('Use NewsEmitter#reset()', () => {
    it('Emits events for resetted events', () => {
      const news = new NewsEmitter();
      const results1: {}[] = [];
      const results2: {}[] = [];
      news.on('foo', (item: {}) => results1.push(item));
      news.on('bar', (item: {}) => results2.push(item));

      assert.ok(news.emit('foo', { foo: 1, zee: 2 }));
      assert.ok(news.emit('foo', 'movie'));

      assert.ok(news.emit('bar', { so: 'lucky' }));
      assert.ok(news.emit('bar', { so: { so: 'lucky' } }));
      assert.ok(!news.emit('bar', { so: 'lucky' }));
      assert.ok(!news.emit('bar', { so: { so: 'lucky' } }));

      news.reset('bar');
      assert.ok(news.emit('bar', { so: 'lucky' }));

      news.reset();
      assert.ok(news.emit('foo', { foo: 1, zee: 2 }));

      assert.deepEqual(results1, [
        { foo: 1, zee: 2 },
        'movie',
        { foo: 1, zee: 2 }
      ]);
      assert.deepEqual(results2, [
        { so: 'lucky' },
        { so: { so: 'lucky' } },
        { so: 'lucky' },
      ]);
    });
  });
});

describe('Filter events', () => {
  it('Only filtered events are kept in history', () => {
    const news = new NewsEmitter({ filter: ['live', 'forever'] });
    const results1: string[][] = [];
    const results2: string[][] = [];
    const results3: string[] = [];

    news.on('live', (a: string, b: string, c: string) => results1.push([a, b, c]));
    news.on('forever', (a: string, b: string, c: string) => results2.push([a, b, c]));
    news.on('item', (item: string) => results3.push(item));

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
  it('Emits only items with different identifiers', () => {
    const news = new NewsEmitter({
      identifier: (a: any[]) => /^foo/.test(a[0]) + '',
    });
    const results1: string[] = [];
    const results2: string[] = [];

    news.on('foo', (item: string) => results1.push(item));
    news.on('bar', (item: string) => results2.push(item));

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
    const news = new NewsEmitter({ manageHistory: true });
    const results1: string[] = [];
    news.on('foo', (a: string) => results1.push(a));

    news.addHistory('foo', [['hello'], ['hello world']]);
    news.emit('foo', 'a');
    news.emit('foo', 'hello world');
    news.emit('foo', 'hello');
    news.emit('foo', 'a');
    assert.deepEqual(results1, ['a', 'a']);

    news.addHistory('foo', [['b'], ['c']]);
    news.emit('foo', 'a');
    news.emit('foo', 'b');
    news.emit('foo', 'c');
    news.emit('foo', 'hello world');
    news.emit('foo', 'hello');
    news.emit('foo', 'indescrivable');
    assert.deepEqual(results1, ['a', 'a', 'a', 'indescrivable']);
  });
});
