'use strict';

import {merge, forEach} from './../utils';
import transformData from './transformData';
import isCancel from '../cancel/isCancel';
import defaults from '../defaults';
import Cancel from '../cancel/Cancel';
import { AxiosRequestConfig } from '../type';

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
function throwIfCancellationRequested<T>(config: AxiosRequestConfig<T>) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }

  if (config.signal && config.signal.aborted) {
    throw new Cancel('canceled');
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
 export default  function dispatchRequest<T>(config: AxiosRequestConfig<T>) {
  /**
   * 请求前判断下是否需要throw 一个cancel
   * 
   * 比如我在请求前就通过CancelToken.source.token.reason = new axios.Cancel('xxx')或signal.abort()
   * 那么这里就捕捉到了
   */
  throwIfCancellationRequested(config);

  // Ensure headers exist
  // 确保headers存在
  config.headers = config.headers || {};

  // Transform request data
  // 转换request data
  config.data = transformData.call(
    config,
    config.data,
    config.headers,
    config.transformRequest!
  );

  // Flatten headers
  // 可简单理解为config.headers = {...config.headers.common, ...config.headers[config.method], ...config.header}
  config.headers = merge(
    config.headers.common || {},
    config.headers[config.method!] || {},
    config.headers
  );
  // 上面已经拿到对应method的header，那么删除掉headers中对应的的key
  forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method: string) {
      delete config.headers![method];
    }
  );

  const adapter = (config.adapter || defaults.adapter)!;

  return adapter(config).then(function onAdapterResolution(response) {
    /**
     * 请求成功响应，如果这时候检测到config.cancelToken或config.signal满足条件，那么也会throw
     * @example
     * const source = axios.CancelToken.source()
     * axios.get<State>('https://api.github.com/users/mzabriskie', {cancelToken: source.token,})
     * source.token.reason = new axios.Cancel('取消请求xxx')
     * 
     * 那么响应后这里会满足throw的条件
     */
    throwIfCancellationRequested(config);

    // Transform response data
    // 转换响应数据
    response.data = transformData.call(
      config,
      response.data,
      response.headers,
      config.transformResponse!
    );
    return response;
  }, function onAdapterRejection(reason) {
    // 请求失败的回调
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData.call(
          config,
          reason.response.data,
          reason.response.headers,
          config.transformResponse!
        );
      }
    }
    /** 
     * 到了这里就是调用source.cancel了 
     * 
     * @example
     * const CancelToken = axios.CancelToken
     * const source = CancelToken.source()
     * 
     * axios.get<State>('https://api.github.com/users/mzabriskie', {cancelToken: source.token,})
     * 
     * source.cancel('取消请求')
    */
    return Promise.reject(reason);
  });
};
