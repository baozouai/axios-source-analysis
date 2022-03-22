'use strict';

import Cancel from './Cancel';
import {CancelExecutor, CancelListener, Canceler} from '../type'
/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
type ResolveCancelType = (value: Cancel | PromiseLike<Cancel>) => void
class CancelToken {
  promise: Promise<Cancel>;
  reason?: Cancel;
  private _listeners: (CancelListener)[] | null = null
  constructor(executor: CancelExecutor) {
    if (typeof executor !== 'function') {
      throw new TypeError('executor must be a function.');
    }
  
    let resolvePromise: ResolveCancelType;
  
    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    });
  
    const token = this;
  
    // 通过CancelToken的source能得到对应的cancel，调用cancel('xxx')后就会执行下面的resolvePromise(token.reason);
    // 那么这里的then就执行 了，那么就会执行对应的listeners，而如果axios中传的config有cancelToken的话，那么就会把xhr中的
    // onCanceled 给subscribe，那么onCanceled就是在_listeners中，那么执行_listeners遇到onCanceled就会把 request.abort();
    // 那么请求就取消了
    this.promise.then(function(cancel) {
      if (!token._listeners) return;
  
      for (let i = 0; i < token._listeners.length; i++) {
        token._listeners[i](cancel);
      }
      // 消费完后置空
      token._listeners = null;
    });
  

    this.promise.then = function(onfulfilled) {
      let _resolve: ResolveCancelType;

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
        // 下面会赋值token.reason，使用判断到有值，说明已经取消了
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
