'use strict';

import { extend } from './utils';
import bind from './helpers/bind';
import Axios from './core/Axios';
import mergeConfig from './core/mergeConfig';
import defaults from './defaults';
import Cancel from './cancel/Cancel'
import { AxiosRequestConfig, AxiosStatic } from './type'
import isAxiosError from './helpers/isAxiosError'
import spread from './helpers/spread'
import CancelToken from './cancel/CancelToken'
import isCancel from './cancel/isCancel'
/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance<T>(defaultConfig: AxiosRequestConfig<T>): AxiosStatic {
  const context = new Axios(defaultConfig);
  // const instance = bind(Axios.prototype.request, context) as unknown as AxiosStatic;
  const instance = Axios.prototype.request.bind(context) as unknown as AxiosStatic;
  // Copy axios.prototype to instance
  extend(instance, Axios.prototype, context);

  // Copy context to instance
  extend(instance, context);
  // Factory for creating new instances
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };

  return instance;
}

// Create the default instance to be exported
const axios = createInstance(defaults);
// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Expose Cancel & CancelToken
axios.Cancel = Cancel;

axios.CancelToken = CancelToken;
axios.isCancel = isCancel;

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = spread;

// Expose isAxiosError
axios.isAxiosError = isAxiosError;

// Allow use of default import syntax in TypeScript
export default  axios;
