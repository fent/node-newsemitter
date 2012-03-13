var EventEmitter = require('events').EventEmitter
  , util = require('util')


/**
 * Emits only new events
 * @param (Object) options 
 * @constructor
 */
var NewsEmitter = module.exports = function(options) {
  EventEmitter.call(this);
  this.history = {};

  // set default options
  this.options = {
    filter: null
  , ignore: ['newListener']
  , maxHistory: 10
  , manageHistory: false
  , comparator: deepEqual
  };

  options = options || {};
  for (var key in this.options) {
    if (options[key] !== undefined) {
      this.options[key] = options[key];
    }
  }

  // validate options
  if (this.options.filter !== null &&
      !Array.isArray(this.options.filter)) {
    throw new Error('options.filter must be an array if given');
  }

  if (!Array.isArray(this.options.ignore)) {
    throw new Error('options.ignore must be an array');
  }

  if (typeof this.options.maxHistory !== 'number' ||
      this.options.maxHistory < 0) {
    throw new Error('options.maxHistory must be a positive integer');
  }

  if (typeof this.options.comparator !== 'function') {
    throw new Error('options.comparator must be a function');
  }
};

util.inherits(NewsEmitter, EventEmitter);

// remember old `emit` method
NewsEmitter.prototype._emit = NewsEmitter.prototype.emit;


/**
 * Emits event, only if it passes comparator or not in history
 * @param (string) event
 * @param (Object) params...
 * @return (boolean) Wether or not event was emitted.
 */
NewsEmitter.prototype.emit = function(event) {
  if (Array.isArray(this.options.filter) &&
      this.options.filter.indexOf(event) === -1 ||
      this.options.ignore.indexOf(event) !== -1) {
    this._emit.apply(this, arguments);
    return true;
  }

  var tistory = this.history[event] || [];

  // add event to history and truncate history
  var auto = !this.options.manageHistory;
  if (auto) {
    tistory.unshift(arguments);
    tistory = tistory.slice(0, this.options.maxHistory);
    this.history[event] = tistory;
  }

  // see if this event is already in history
  for (var i = +auto, len = tistory.length; i < len; i++) {
    if (this.options.comparator(arguments, tistory[i])) {
      if (auto) {
        tistory.splice(i, 1);
      }
      return false;
    }
  }

  // if not found in history, this is news
  this._emit.apply(this, arguments);
  return true;
};


/**
 * Resets event history
 * @param (string?) event
 */
NewsEmitter.prototype.reset = function(event) {
  if (event) {
    delete this.history[event];
  } else {
    this.history = {};
  }
};


/**
 * Manual managing of event history
 * @param (string) event
 * @param (Array) arr An array of items to add to history.
 */
NewsEmitter.prototype.addHistory = function(event, arr) {
  var tistory = this.history[event];
  if (tistory && arr.length < this.options.maxHistory) {
    this.history[event] = arr.slice().reverse()
      .concat(tistory.slice(0, this.options.maxHistory - arr.length));

  } else {
    this.history[event] = arr.slice(arr.length - this.options.maxHistory)
      .reverse();
  }
};


/**
 * Compares 2 Javascript objects to determine if they're equal
 * @param (Object) a
 * @param (Object) b
 * @return (boolean)
 */
function deepEqual(a, b) {
  var t1 = typeof a;
  var t2 = typeof b;
  if (t1 !== t2) return false;
  if (t1 !== 'object') return a === b;

  var k1 = Object.keys(a).sort();
  var k2 = Object.keys(b).sort();
  if (k1.length !== k2.length) return false;

  for (var i = 0, len = k1.length; i < len; i++) {
    if (k1[i] !== k2[i]) return false;
    if (!deepEqual(a[k1[i]], b[k2[i]])) return false;
  }

  return true;
}
