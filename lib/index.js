var EventEmitter = require('events').EventEmitter;
var util = require('util');


/**
 * Emits only new events.

 * @param (Object) options
 * @constructor
 */
var NewsEmitter = module.exports = function(options) {
  EventEmitter.call(this);
  this.history = {};
  this.historyMap = {};

  // Set default options.
  this.options = {
    filter: null,
    ignore: ['newListener'],
    maxHistory: 10,
    manageHistory: false,
    identifier: JSON.stringify
  };

  options = options || {};
  for (var key in this.options) {
    if (options[key] !== undefined) {
      this.options[key] = options[key];
    }
  }

  // Validate options.
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

  if (typeof this.options.identifier !== 'function') {
    throw new Error('options.identifier must be a function');
  }
};

util.inherits(NewsEmitter, EventEmitter);

// Remember old `emit` method.
NewsEmitter.prototype._emit = NewsEmitter.prototype.emit;


/**
 * Emits event, only if not already in history.

 * @param (String) event
 * @param (Object) params...
 * @return (Boolean) Wether or not event was emitted
 */
NewsEmitter.prototype.emit = function(event) {
  if (Array.isArray(this.options.filter) &&
      this.options.filter.indexOf(event) === -1 ||
      this.options.ignore.indexOf(event) !== -1) {
    this._emit.apply(this, arguments);
    return true;
  }

  var tistory = this.history[event] || [];
  var tistoryMap = this.historyMap[event] || {};
  var key = this.options.identifier(arguments);
  var found = tistoryMap[key] !== undefined;

  // Add event to history and truncate history.
  var auto = !this.options.manageHistory;
  if (auto) {
    if (found) {
      // Remove event from the list of already there.
      tistory.splice(tistoryMap[key], 1);
    }

    // Add event to back and remember its index.
    tistoryMap[key] = tistory.push(key) - 1;
    if (tistory.length > this.options.maxHistory) {
      delete tistoryMap[tistory[0]];
      tistory.splice(0, 1);
    }

    this.history[event] = tistory;
    this.historyMap[event] = tistoryMap;
  }

  // See if this event is already in history.
  if (found) {
    return false;

  } else {
    // If not found in history, this is news.
    this._emit.apply(this, arguments);
    return true;
  }
};


/**
 * Resets event history.
 *
 * @param (String?) event
 */
NewsEmitter.prototype.reset = function(event) {
  if (event) {
    delete this.history[event];
    delete this.historyMap[event];
  } else {
    this.history = {};
    this.historyMap = {};
  }
};


/**
 * Manual managing of event history.
 *
 * @param (String) event
 * @param (Array.<Object>) arr An array of items to add to history.
 */
NewsEmitter.prototype.addHistory = function(event, arr) {
  var tistory = this.history[event] || [];
  var tistoryMap = this.historyMap[event] || {};

  for (var i = 0, len = arr.length; i < len; i++) {
    var key = this.options.identifier(arr[i]);
    var found = tistoryMap[key] !== undefined;
    if (found) {
      tistory.splice(tistoryMap[key], 1);
    }
    tistoryMap[key] = tistory.push(key) - 1;
    if (tistory.length > this.options.maxHistory) {
      delete tistoryMap[tistory[0]];
      tistory.splice(0, 1);
    }
  }

  this.history[event] = tistory;
  this.historyMap[event] = tistoryMap;
};
