'use strict';

import { isURLSearchParams, forEach, isArray, isDate, isObject } from './../utils';

function encode(val: string | number | boolean) {
  return encodeURIComponent(val).
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
export default function buildURL(url = '', params?: any, paramsSerializer?: (params: any)=> string) {
  if (!params) {
    return url;
  }

  let serializedParams: string;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    const parts: string[] = [];

    forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (isArray(val)) {
        // 设置的前面要先加'[]'，比如这里的key是links，val是['http://www.baidu.com','http://www.google.cn']
        // 如http://localhost:8080/post?links[]=http://www.baidu.com&links[]=http://www.google.cn
        key = key + '[]';
      } else {
        val = [val];
      }

      forEach(val, function parseValue(v) {
        if (isDate(v)) {
          v = v.toISOString();
        } else if (isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    // serializedParams有值，说明有params
    const hashmarkIndex = url.indexOf('#');
    if (hashmarkIndex !== -1) {
      // 如果url包含'#',那么取开始到'#'前一个
      url = url.slice(0, hashmarkIndex);
    }
    // 如果url包含?，说明url本身已有paramsSerial,那么直接用'&'拼接上新的serializedParams，否则要先加上?
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};
