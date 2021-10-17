'use strict';
import { AxiosRequestConfig, AxiosRequestHeaders } from "./type";
import { isUndefined, isString, isObject, trim, isFormData, isArrayBuffer, isBuffer, isStream, isFile, isBlob, isArrayBufferView, isURLSearchParams, forEach, merge } from './utils';
import normalizeHeaderName from './helpers/normalizeHeaderName';
import enhanceError from './core/enhanceError';
import xhr from './adapters/xhr'
import AdaptersHttp from './adapters/http'
const DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers?: AxiosRequestHeaders, value?: any) {
  if (!isUndefined(headers) && isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}
/** 获取适配器，即获取要请求的adapter */
function getDefaultAdapter() {
  let adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    // 浏览器的
    adapter = xhr;
  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    // node的
    adapter = AdaptersHttp;
  }
  return adapter;
}

function stringifySafely(rawValue: any, parser?: (val: string) => any, encoder?:(val: any) => string) {
  if (isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return trim(rawValue);
    } catch (e: any) {
      if (e.name !== 'SyntaxError') {
        throw e;
      }
    }
  }

  return (encoder || JSON.stringify)(rawValue);
}

const defaults: AxiosRequestConfig = {
  transitional: {
    silentJSONParsing: true,
    forcedJSONParsing: true,
    clarifyTimeoutError: false
  },
  // @ts-ignore
  adapter: getDefaultAdapter(),

  transformRequest: [function transformRequest(data, headers) {
    // 请求头有accept字段的话，那么改为Accept，且删除原有字段accept
    normalizeHeaderName(headers!, 'Accept');
    // Content-Type同理
    normalizeHeaderName(headers!, 'Content-Type');
    // 如果data是FormData、ArrayBuffrer、Buffer、Stream、File、Blob类型的，那么不用处理，直接return
    if (isFormData(data) ||
      isArrayBuffer(data) ||
      isBuffer(data) ||
      isStream(data) ||
      isFile(data) ||
      isBlob(data)
    ) {
      return data;
    }
    // 如果是ArrayBufferView，取出其buffer，并返回
    if (isArrayBufferView(data)) {
      return data.buffer;
    }
    // 如果是URLSearchParams,那么设置请求头，并返回其string形式
    if (isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }
    // 如果是对象或请求头有Content-Type为application/json
    if (isObject(data) || (headers && headers['Content-Type'] === 'application/json')) {
      // 如果没Content-Type，那么设置一下
      setContentTypeIfUnset(headers, 'application/json');
      // 然后将data stringify
      return stringifySafely(data);
    }
    // 上面都不满足，返回原data
    return data;
  }],

  transformResponse: [function transformResponse(data) {
    const transitional = this.transitional || defaults.transitional;
    /** 是否忽略JSON.parse(response.body)的错误 */
    const silentJSONParsing = transitional && transitional.silentJSONParsing;
    /** 当responseType!== json时将是否response转化为json */
    const forcedJSONParsing = transitional && transitional.forcedJSONParsing;
    /** 不能忽略JSON.parse(response.body)的错误且respnoseType为json */
    const strictJSONParsing = !silentJSONParsing && this.responseType === 'json';
    // 如果是严格解析，或者非严格且data是字符串且有数据
    if (strictJSONParsing || (forcedJSONParsing && isString(data) && data.length)) {
      try {
        // 那么调用JSON.parse
        return JSON.parse(data);
      } catch (e: any) {
        // 如果非严格，比如JSON.parse('xxx'),那么会catch到，但不会throw
        if (strictJSONParsing) {
          // 只有严格JSONParsing才会抛出错误
          // 如果是严格解析
          if (e.name === 'SyntaxError') {
            throw enhanceError(e, this, 'E_JSON_PARSE');
          }
          throw e;
        }
      }
    }

    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,
  maxBodyLength: -1,

  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },
  /** headers里面有common；delete、get、head(默认空对象);post、put、patch(默认DEFAULT_CONTENT_TYPE) */
  headers: {
    common: {
      'Accept': 'application/json, text/plain, */*'
    }
  }
};

forEach(['delete', 'get', 'head'], function forEachMethodNoData(method: 'delete'| 'get'| 'head') {
  defaults.headers![method as unknown as string] = {};
});

forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers![method] = merge(DEFAULT_CONTENT_TYPE);
});

export default defaults;
