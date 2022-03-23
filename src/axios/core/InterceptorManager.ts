'use strict';

import { forEach } from '../utils';
import { FulfilledFn, RejectedFn, AxiosRequestConfig, InterceptorConfig, Interceptor } from '../type'

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
      synchronous: options?.synchronous || false,
      runWhen: options?.runWhen || null
    });
    return this.handlers.length - 1;
  }

  /**
   * @description 上面的use会返回对应的index，所以这里可以通过索引eject掉对应的拦截器
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
   * @description 将每个非空的interceptor传给fn
   * 
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
  forEach(fn: (interceptor: Interceptor<V>) => void) {
    forEach(this.handlers, function forEachHandler(h) {
      if (h !== null) {
        fn(h);
      }
    });
  };
}



export default InterceptorManager;
