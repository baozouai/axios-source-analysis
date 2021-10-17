'use strict';

import { AxiosResponse } from '../type';
import createError from './createError';

/**
 * @description 根据响应状态码决定要resolve还是reject
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
 export default function settle(resolve: (value: any) => any, reject: (reason: any) => any, response: AxiosResponse) {
  const validateStatus = response.config.validateStatus;
  // 如果没有状态码或者没验证状态码函数或者验证通过，那么resolve
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    // 到了这里就是有状态码和验证状态码函数，但验证不通过，reject掉
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ));
  }
};