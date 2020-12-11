import { EventEmitter } from 'events';


export interface Options {
  filter?: null | string[];
  ignore?: null | string[];
  maxHistory?: number;
  manageHistory?: boolean;
  identifier?: (args: any[]) => string;
}

export type DefaultOptions = Required<Options>;

export default class NewsEmitter extends EventEmitter {
  public history: Map<string, Set<string>>;
  public options: DefaultOptions;

  /**
   * Emits only new events.

   * @param {Object} options
   * @constructor
   */
  constructor(options?: Options) {
    super();
    this.history = new Map<string, Set<string>>();

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
      throw Error('options.ignore must be an array if given');
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
  emit(event: string, ...args: any[]) {
    if (Array.isArray(this.options.filter) && this.options.filter.indexOf(event) === -1 ||
        Array.isArray(this.options.ignore) && this.options.ignore.indexOf(event) !== -1) {
      super.emit(event, ...args);
      return true;
    }

    const tistory = this.history.get(event) || new Set();
    if (!this.history.has(event)) {
      this.history.set(event, tistory);
    }
    const key = this.options.identifier(args);
    const found = tistory.has(key);

    // Add event to history and truncate history.
    if (!this.options.manageHistory) {
      this._addHistory(tistory, key);
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
   * Adds one history item to an event's history.
   *
   * @param {Set} tistory
   * @param {string} key
   */
  _addHistory(tistory: Set<string>, key: string) {
    // Re-add event from history so it gets moved to the back.
    tistory.delete(key);
    tistory.add(key);
    if (tistory.size > this.options.maxHistory) {
      // Remove the first item from history if size exteends `maxHistory`
      tistory.delete(tistory.keys().next().value);
    }
  }


  /**
   * Resets event history.
   *
   * @param {!String} event
   */
  reset(event?: string) {
    if (event) {
      this.history.delete(event);
    } else {
      this.history.clear();
    }
  }


  /**
   * Manual managing of event history.
   *
   * @param {string} event
   * @param {Array.<Object>} arr An array of items to add to history.
   */
  addHistory(event: string, arr: any[]) {
    const tistory = this.history.get(event) || new Set();
    if (!this.history.has(event)) {
      this.history.set(event, tistory);
    }

    for (let item of arr) {
      this._addHistory(tistory, this.options.identifier(item));
    }
  }
}

module.exports = NewsEmitter;
