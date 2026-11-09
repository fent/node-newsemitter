import { EventEmitter } from 'node:events';

export interface Options<T = unknown[]> {
  filter?: null | string[];
  ignore?: null | string[];
  maxHistory?: number;
  manageHistory?: boolean;
  identifier?: (args: T) => string;
}

export type DefaultOptions<T = unknown[]> = Required<Options<T>>;

export default class NewsEmitter<T = unknown[]> extends EventEmitter {
  public history: Map<string, Set<string>>;
  public options: DefaultOptions<T>;

  /**
   * Emits only new events.
   */
  constructor(options?: Options<T>) {
    super();
    this.history = new Map<string, Set<string>>();

    // Set default options.
    this.options = Object.assign(
      {
        filter: null,
        ignore: ['newListener', 'removeListener'],
        maxHistory: 10,
        manageHistory: false,
        identifier: JSON.stringify as unknown as (args: T) => string,
      },
      options,
    );

    // Validate options.
    if (this.options.filter !== null && !Array.isArray(this.options.filter)) {
      throw Error('options.filter must be an array if given');
    }

    if (!Array.isArray(this.options.ignore)) {
      throw Error('options.ignore must be an array if given');
    }

    if (
      typeof this.options.maxHistory !== 'number' ||
      this.options.maxHistory < 0
    ) {
      throw Error('options.maxHistory must be a positive integer');
    }

    if (typeof this.options.identifier !== 'function') {
      throw Error('options.identifier must be a function');
    }
  }

  /**
   * Emits event, only if not already in history.
   */
  emit(event: string, ...args: unknown[]) {
    if (
      (Array.isArray(this.options.filter) &&
        this.options.filter.indexOf(event) === -1) ||
      (Array.isArray(this.options.ignore) &&
        this.options.ignore.indexOf(event) !== -1)
    ) {
      super.emit(event, ...args);
      return true;
    }

    const eventHistory = this.history.get(event) || new Set();
    if (!this.history.has(event)) {
      this.history.set(event, eventHistory);
    }
    const key = this.options.identifier(args as unknown as T);
    const found = eventHistory.has(key);

    // Add event to history and truncate history.
    if (!this.options.manageHistory) {
      this._addHistory(eventHistory, key);
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
   */
  _addHistory(eventHistory: Set<string>, key: string) {
    // Re-add event from history so it gets moved to the back.
    eventHistory.delete(key);
    eventHistory.add(key);
    if (eventHistory.size > this.options.maxHistory) {
      // Remove the first item from history if size exteends `maxHistory`
      eventHistory.delete(eventHistory.keys().next().value as string);
    }
  }

  /**
   * Resets event history.
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
   */
  addHistory(event: string, arr: T[]) {
    const eventHistory = this.history.get(event) || new Set();
    if (!this.history.has(event)) {
      this.history.set(event, eventHistory);
    }

    for (const item of arr) {
      this._addHistory(eventHistory, this.options.identifier(item));
    }
  }
}

module.exports = NewsEmitter;
