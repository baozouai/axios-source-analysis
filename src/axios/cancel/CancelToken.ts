'use strict';

import Cancel from './Cancel';
import {CancelExecutor, CancelListener, Canceler} from '../type'
/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */

class CancelToken {
  promise: Promise<Cancel>;
  reason?: Cancel;
  private _listeners: (CancelListener)[] | null = null
  constructor(executor: CancelExecutor) {
    if (typeof executor !== 'function') {
      throw new TypeError('executor must be a function.');
    }
  
    let resolvePromise: any;
  
    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    });
  
    const token = this;
  

    this.promise.then(function(cancel) {
      if (!token._listeners) return;
  
      for (let i = 0; i < token._listeners.length; i++) {
        token._listeners[i](cancel);
      }
      token._listeners = null;
    });
  

    this.promise.then = function(onfulfilled) {
      let _resolve: any;

      const promise = new Promise<Cancel>(function(resolve) {
        token.subscribe(resolve);
        _resolve = resolve;
      }).then(onfulfilled);
      //@ts-ignore
      promise.cancel = function reject() {
        // @ts-ignore
        token.unsubscribe(_resolve);
      };
  
      return promise as typeof promise & { cancel(): void};
    };
  
    executor(function cancel(message) {
      if (token.reason) {
        // Cancellation has already been requested
        return;
      }
  
      token.reason = new Cancel(message);
      resolvePromise(token.reason);
    });
  }
  throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  };
  
  subscribe(listener: CancelListener) {
    if (this.reason) {
      listener(this.reason);
      return;
    }
  
    if (this._listeners) {
      this._listeners.push(listener);
    } else {
      this._listeners = [listener];
    }
  }
  /**
 * Unsubscribe from the cancel signal
 */
  unsubscribe(listener: CancelListener) {
    if (!this._listeners) {
      return;
    }
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }
  /**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
  static source() {
    let cancel!: Canceler;
    const token = new CancelToken(function executor(c) {
      cancel = c;
    });
    return {
      token,
      cancel
    };
  }
}



export default  CancelToken;
