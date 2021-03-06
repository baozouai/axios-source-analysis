'use strict';

import { forEach } from './../utils';
import defaults from './../defaults';
import { AxiosRequestHeaders, AxiosResponseHeaders } from '../type'
/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
export default function transformData(data: any, headers: AxiosRequestHeaders | AxiosResponseHeaders, fns: Function | Function[]) {
  // @ts-ignore
  const context = this || defaults;

  forEach(fns, function transform(fn: (data: any, headers: AxiosRequestHeaders | AxiosResponseHeaders) => any) {
    data = fn.call(context, data, headers);
  });

  return data;
};
