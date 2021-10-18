'use strict';
import { isPlainObject, merge, isArray, isUndefined, forEach } from '../utils';

/**
 * @description: merge后生成的新config的任何修改不会影响传入的config
 * 
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 * @returns {Object} New object resulting from merging config2 to config1
 */
export default function mergeConfig(config1: Record<string, any>, config2: Record<string, any> = {}) {
  const config: Record<string, any> = {};

  function getMergedValue(target?: any, source?: any) {
    if (isPlainObject(target) && isPlainObject(source)) {
      return merge(target, source);
    } else if (isPlainObject(source)) {
      return merge({}, source);
    } else if (isArray(source)) {
      return source.slice();
    }
    return source;
  }

  function mergeDeepProperties(prop: string) {
    if (!isUndefined(config2[prop])) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (!isUndefined(config1[prop])) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  function valueFromConfig2(prop: string) {
    if (!isUndefined(config2[prop])) {
      return getMergedValue(undefined, config2[prop]);
    }
  }

  function defaultToConfig2(prop: string) {
    if (!isUndefined(config2[prop])) {
      return getMergedValue(undefined, config2[prop]);
    } else if (!isUndefined(config1[prop])) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  function mergeDirectKeys(prop: string) {
    if (prop in config2) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (prop in config1) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  const mergeMap = {
    'url': valueFromConfig2,
    'method': valueFromConfig2,
    'data': valueFromConfig2,
    'baseURL': defaultToConfig2,
    'transformRequest': defaultToConfig2,
    'transformResponse': defaultToConfig2,
    'paramsSerializer': defaultToConfig2,
    'timeout': defaultToConfig2,
    'timeoutMessage': defaultToConfig2,
    'withCredentials': defaultToConfig2,
    'adapter': defaultToConfig2,
    'responseType': defaultToConfig2,
    'xsrfCookieName': defaultToConfig2,
    'xsrfHeaderName': defaultToConfig2,
    'onUploadProgress': defaultToConfig2,
    'onDownloadProgress': defaultToConfig2,
    'decompress': defaultToConfig2,
    'maxContentLength': defaultToConfig2,
    'maxBodyLength': defaultToConfig2,
    'transport': defaultToConfig2,
    'httpAgent': defaultToConfig2,
    'httpsAgent': defaultToConfig2,
    'cancelToken': defaultToConfig2,
    'socketPath': defaultToConfig2,
    'responseEncoding': defaultToConfig2,
    'validateStatus': mergeDirectKeys
  };

  forEach(Object.keys(config1).concat(Object.keys(config2)), function computeConfigValue(prop: string) {
    const merge = mergeMap[prop as keyof typeof mergeMap] || mergeDeepProperties;
    const configValue = merge(prop);
    (isUndefined(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
  });
  return config;
};
