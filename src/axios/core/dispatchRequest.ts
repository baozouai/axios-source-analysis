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
  throwIfCancellationRequested(config);

  // Ensure headers exist
  config.headers = config.headers || {};

  // Transform request data
  config.data = transformData.call(
    config,
    config.data,
    config.headers,
    config.transformRequest!
  );

  // Flatten headers
  config.headers = merge(
    config.headers.common || {},
    config.headers[config.method!] || {},
    config.headers
  );

  forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method: string) {
      delete config.headers![method];
    }
  );

  const adapter = config.adapter || defaults.adapter;

  return adapter!(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData.call(
      config,
      response.data,
      response.headers,
      config.transformResponse!
    );
    return response;
  }, function onAdapterRejection(reason) {
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

    return Promise.reject(reason);
  });
};
