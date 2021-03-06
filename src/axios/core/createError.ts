'use strict';

import enhanceError from './enhanceError';
import { AxiosRequestConfig, AxiosResponse} from '../type'
/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */
 export default  function createError(message: string, config: AxiosRequestConfig, code?: string | null, request?: any, response?: AxiosResponse) {
  const error = new Error(message);
  return enhanceError(error, config, code, request, response);
};
