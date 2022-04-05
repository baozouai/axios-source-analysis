'use strict';

import {isFormData, isStandardBrowserEnv, forEach, isUndefined} from './../utils';
import settle from './../core/settle';
import cookies from './../helpers/cookies';
import buildURL from './../helpers/buildURL';
import buildFullPath from '../core/buildFullPath';
import parseHeaders from './../helpers/parseHeaders';
import isURLSameOrigin from './../helpers/isURLSameOrigin';
import createError from '../core/createError';
import defaults from '../defaults';
import Cancel from '../cancel/Cancel';
import { AxiosRequestConfig, CancelListener } from '../type';
/**
 * @description 对应浏览器的请求
 * @param config 请求头配置
 */
export default  function xhrAdapter<D>(config: AxiosRequestConfig<D>) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    // 获取请求的 data
    let requestData: D | null | undefined = config.data;
    const requestHeaders = config.headers!;
    const responseType = config.responseType;
    let onCanceled: CancelListener;
    /** 取消订阅或移除abort监听器 */
    function done() {
      // 已经done了，那么就取消掉onCanceled的订阅
      if (config.cancelToken) {
        // 无论有没有订阅，都取消订阅
        config.cancelToken.unsubscribe(onCanceled);
      }

      if (config.signal) {
        // @ts-ignore
        config.signal.removeEventListener('abort', onCanceled);
      }
    }
    // 如果请求体是FormData，那么不需要Content-Type,浏览器会自动设置
    if (isFormData(requestData)) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    let request:XMLHttpRequest  = new XMLHttpRequest();

    // HTTP basic authentication
    // 配置验证
    if (config.auth) {
      const username = config.auth.username || '';
      const password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }
    // 如果有baseURL,那么合并成fullPath
    const fullPath = buildFullPath(config.baseURL, config.url);
    // method要大写，将params序列话拼接到fullPath上，如params={a: 1, b: 2}, 
    // fullPath = 'https://baozouai.com/post', 那么buildURL后为https://baozouai.com/post?a=1&b=2
    // 如果有配置paramsSerializer，那么可以自定义params序列化
    // 第三个参数表示async，是否异步
    request.open(config.method!.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    // 配置请求超时时间
    request.timeout = config.timeout!;
    /** 请求成功响应  */
    function onloadend() {
      // 请求成功了，但是被取消了，onCanceled里面把request置为null了
      if (!request) {
        return;
      }
      // 预处理响应
      // Prepare the response
      // 获取响应头
      const responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      // 如果没有设置响应类型或者设置了响应类型为text或json，那么响应数据取responseText，否则取response
      const responseData = !responseType || responseType === 'text' ||  responseType === 'json' ?
        request.responseText : request.response;
      const response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config,
        request,
      };
      // 根据响应状态码决定要resolve还是reject 
      settle(function _resolve(value) {
        resolve(value);
        done();
      }, function _reject(err) {
        reject(err);
        done();
        // @ts-ignore
      }, response);

      // Clean up request
      //置为null，好让垃圾回收
      // @ts-ignore
      request = null;
    }
    // 一些浏览器支持onloadend,一些支持onreadystatechange，所以这里分开判断下
    if ('onloadend' in request) {
      // Use onloadend if available
      request.onloadend = onloadend;
    } else {
      // Listen for ready state to emulate onloadend
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) return

        // The request errored out and we didn't get a response, this will be
        // handled by onerror instead
        // With one exception: request that using file: protocol, most browsers
        // will return status as 0 even though it's a successful request
        /**
         * 如果请求报错了，那么获取不到response，而是会被onerror处理
         * 但有一个例外：即请求使用的是file:协议，其失败了但还是会触发onreadystatechange，返回状态码0，这里拦截一下
         */
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) return
        // readystate handler is calling before onerror or ontimeout handlers,
        // so we should call onloadend on the next 'tick'
        // readyState的调用是在onerror或ontimeout之前，所以这里放到下一个tick中
        setTimeout(onloadend);
      };
    }
    // 处理浏览器取消请求的回调，不是手动取消
    // Handle browser request cancellation (as opposed to a manual cancellation)
    request.onabort = function handleAbort() {
      // 调用request.abort后这里会监听到，在下面的onCanceled里
      if (!request) {
        return;
      }

      reject(createError('Request aborted', config, 'ECONNABORTED', request));

      // Clean up request
      // @ts-ignore
      // 已经取消了，那么将request置空
      request = null;
    };
    // 网络请求失败的回调
    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request));

      // Clean up request
      // @ts-ignore
      request = null;
    };
    // 超时回调
    // Handle timeout
    request.ontimeout = function handleTimeout() {
      let timeoutErrorMessage = config.timeout ? 'timeout of ' + config.timeout + 'ms exceeded' : 'timeout exceeded';
      const transitional = (config.transitional || defaults.transitional)!;
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(createError(
        timeoutErrorMessage,
        config,
        transitional.clarifyTimeoutError ? 'ETIMEDOUT' : 'ECONNABORTED',
        request));

      // Clean up request
      // @ts-ignore
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    // 是标准浏览器环境的话，web worker和rn不是
    if (isStandardBrowserEnv()) {
      // Add xsrf header
      // 配置跨站请求伪造(xsrf)头
      const xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
        cookies.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName!] = xsrfValue;
      }
    }
    // 给request增加headers
    // Add headers to the request
    if ('setRequestHeader' in request) {
      forEach(requestHeaders, function setRequestHeader(val, key) {
        // 这里针对Content-Type
        if (typeof requestData === 'undefined' && (key as string).toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          // 如果没有请求体，且请求头有Content-Type, 那么删除掉，因为没有请求体，不需要该请求头
          delete requestHeaders[key];
        } else {
          // 其他的加上对应的请求头，当然如果有请求体，且请求头有Content-Type，那么请求要加上
          // Otherwise add header to the request
          request.setRequestHeader(key as string, val);
        }
      });
    }

    // Add withCredentials to request if needed
    // withCredentials: 跨域请求要不要携带cookie
    if (!isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // Add responseType to request if needed
    // 如果有响应类型且不为json，那么加上
    if (responseType && responseType !== 'json') {
      // @ts-ignore
      request.responseType = config.responseType;
    }

    // Handle progress if needed
    // 如果配置了downLoad的监听，那么加上
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    // 如果配置了上传的监听，那么加上，但不是所有的浏览器都支持
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }
    // 如果配置了cancelToken或signal，那么加上对应的onCanceled订阅或添加abort监听器
    if (config.cancelToken || config.signal) {
      // Handle cancellation
      // @ts-ignore
      onCanceled = function(cancel?: {type?: string}) {
        if (!request) {
          return;
        }
        // cancel && cancel.type是aborted的监听事件
        reject(!cancel || (cancel && cancel.type) ? new Cancel('canceled') : cancel);
        /**
         * 如果该请求已被发出，XMLHttpRequest.abort() 方法将终止该请求。
         * 当一个请求被终止，它的  readyState 将被置为 XMLHttpRequest.UNSENT (0)，
         * 并且请求的 status 置为 0
         * 
         * https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/abort
         * 
         * 这里调用后会立即触发上面的request.onabort
         */
        request.abort();
        // @ts-ignore
        request = null;
      };
      // 有cancelToken，那么加入订阅，如果cancelToken调用了cancel，那么这里就能触发onCanceled了
      config.cancelToken?.subscribe(onCanceled);
      if (config.signal) {
        // @ts-ignore
        // 如果已经aborted了，那么直接执行onCanceled，这个发生在请求之前
        // 否则监听signal是否abort，是的话调用回调onCanceled，这个发生在请求之后
        config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled);
      }
    }
    // 如果没有请求体，那么设为null
    if (!requestData) {
      requestData = null;
    }

    // Send the request
    request.send(requestData as Document | XMLHttpRequestBodyInit | null);
  });
};
