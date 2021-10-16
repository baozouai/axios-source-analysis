'use strict';

import { forEach } from '../utils';
import { FulfilledFn, RejectedFn, AxiosRequestConfig, InterceptorConfig, AxiosInterceptorManager, Interceptor } from '../type'

export class InterceptorManager<V> {
  handlers: Array<Interceptor<V> | null> = [];
  /**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
  use(onFulfilled?: FulfilledFn<V>, onRejected?: RejectedFn, options?: InterceptorConfig<AxiosRequestConfig<V>>): number {
    this.handlers.push({
      fulfilled: onFulfilled,
      rejected: onRejected,
      synchronous: options ? options.synchronous : false,
      runWhen: options ? options.runWhen : null
    });
    return this.handlers.length - 1;
  }

  /**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
  eject(id: number) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  };
  /**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
  forEach(fn: (interceptor: Interceptor<V>) => any) {
    forEach(this.handlers, function forEachHandler(h) {
      if (h !== null) {
        fn(h);
      }
    });
  };
}



export default InterceptorManager;
