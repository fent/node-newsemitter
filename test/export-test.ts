import assert from 'node:assert';
import NewsEmitter, { NewsEmitter as NamedNewsEmitter } from '..';

describe('Exports', () => {
  it('Exposes class as default and named export', () => {
    assert.strictEqual(NewsEmitter, NamedNewsEmitter);
    assert.strictEqual(NewsEmitter.NewsEmitter, NewsEmitter);
    assert.strictEqual(NewsEmitter.default, NewsEmitter);
  });
});
