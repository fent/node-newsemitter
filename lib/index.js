const EventEmitter = require('events').EventEmitter;


module.exports = class NewsEmitter extends EventEmitter {
  /**
   * Emits only new events.

   * @param {Object} options
   * @constructor
   */
  constructor(options) {
    super();
    this.history = {};
    this.historyMap = {};

    // Set default options.
    this.options = Object.assign({
      filter: null,
      ignore: ['newListener', 'removeListener'],
      maxHistory: 10,
      manageHistory: false,
      identifier: JSON.stringify
    }, options);

    // Validate options.
    if (this.options.filter !== null &&
        !Array.isArray(this.options.filter)) {
      throw Error('options.filter must be an array if given');
    }

    if (!Array.isArray(this.options.ignore)) {
      throw Error('options.ignore must be an array');
    }

    if (typeof this.options.maxHistory !== 'number' ||
        this.options.maxHistory < 0) {
      throw Error('options.maxHistory must be a positive integer');
    }

    if (typeof this.options.identifier !== 'function') {
      throw Error('options.identifier must be a function');
    }
  }


  /**
   * Emits event, only if not already in history.
   *
   * @param {string} event
   * @param {Object} ...args
   * @return {boolean} Wether or not event was emitted
   */
  emit(event, ...args) {
    if (Array.isArray(this.options.filter) &&
        this.options.filter.indexOf(event) === -1 ||
        this.options.ignore.indexOf(event) !== -1) {
      super.emit(event, ...args);
      return true;
    }

    const tistory = this.history[event] || [];
    const tistoryMap = this.historyMap[event] || {};
    const key = this.options.identifier(args);
    const found = tistoryMap[key] !== undefined;

    // Add event to history and truncate history.
    const auto = !this.options.manageHistory;
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
      super.emit(event, ...args);
      return true;
    }
  }


  /**
   * Resets event history.
   *
   * @param {!String} event
   */
  reset(event) {
    if (event) {
      delete this.history[event];
      delete this.historyMap[event];
    } else {
      this.history = {};
      this.historyMap = {};
    }
  }


  /**
   * Manual managing of event history.
   *
   * @param {string} event
   * @param {Array.<Object>} arr An array of items to add to history.
   */
  addHistory(event, arr) {
    const tistory = this.history[event] || [];
    const tistoryMap = this.historyMap[event] || {};

    for (let item of arr) {
      const key = this.options.identifier(item);
      if (key in tistoryMap) {
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
  }
};
