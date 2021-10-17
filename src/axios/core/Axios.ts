import buildURL from '../helpers/buildURL';
import InterceptorManager from './InterceptorManager';
import dispatchRequest from './dispatchRequest';
import mergeConfig from './mergeConfig';
import validator from '../helpers/validator';
import { AxiosResponse, AxiosRequestConfig, Method } from '../type'
const { validators } = validator
/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
class Axios {
  interceptors = {
    request: new InterceptorManager<AxiosRequestConfig>(),
    response: new InterceptorManager<AxiosResponse>()
  };
  defaults: AxiosRequestConfig = {}

  constructor(config: AxiosRequestConfig = {}) {
    this.defaults = config;
  }

  request<T = unknown, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D>): Promise<R> {
    if (typeof config === 'string') {
      config = arguments[1] || {};
      config.url = arguments[0];
    } else {
      config = config || {};
    }

    config = mergeConfig(this.defaults, config);
    // Set config.method
    if (config.method) {
      config.method = config.method.toLowerCase() as Method;
    } else if (this.defaults.method) {
      config.method = this.defaults.method.toLowerCase() as Method;
    } else {
      config.method = 'get';
    }

    const transitional = config.transitional;
    if (transitional !== undefined) {
      validator.assertOptions(transitional, {
        silentJSONParsing: validators.transitional(validators.boolean),
        forcedJSONParsing: validators.transitional(validators.boolean),
        clarifyTimeoutError: validators.transitional(validators.boolean)
      }, false);
    }

    // filter out skipped interceptors
    const requestInterceptorChain: any[] = [];
    let synchronousRequestInterceptors = true;
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
        return;
      }

      synchronousRequestInterceptors = !!(synchronousRequestInterceptors && interceptor.synchronous);

      requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
    });

    const responseInterceptorChain: any[] = [];
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });

    let promise;

    if (!synchronousRequestInterceptors) {
      var chain = [dispatchRequest, undefined];

      Array.prototype.unshift.apply(chain, requestInterceptorChain);
      chain = chain.concat(responseInterceptorChain);

      promise = Promise.resolve(config);
      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise as Promise<R>;
    }


    let newConfig = config;
    while (requestInterceptorChain.length) {
      const onFulfilled = requestInterceptorChain.shift();
      const onRejected = requestInterceptorChain.shift();
      try {
        newConfig = onFulfilled(newConfig);
      } catch (error) {
        onRejected(error);
        break;
      }
    }

    try {
      promise = dispatchRequest(newConfig);
    } catch (error) {
      return Promise.reject(error);
    }

    while (responseInterceptorChain.length) {
      promise = promise.then(responseInterceptorChain.shift(), responseInterceptorChain.shift());
    }

    return promise as unknown as Promise<R>;
  };

  getUri(config: AxiosRequestConfig): string {
    config = mergeConfig(this.defaults, config);
    return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
  };

  private forEachMethodNoData<T = unknown, R = AxiosResponse<T>, D = any>(method: 'delete' | 'get' | 'head' | 'options') {
    return (url: string, config?: AxiosRequestConfig<D>) => {
      return this.request<T, R, D>(mergeConfig(config || {}, {
        method,
        url,
      }));
    };
  };
  private forEachMethodWithData<T = unknown, R = AxiosResponse<T>, D = any>(method: 'post' | 'put' | 'patch') {
    return (url: string, data?: D, config?: AxiosRequestConfig<D>) => {
      return this.request<T, R, D>(mergeConfig(config || {}, {
        method,
        url,
        data
      }));
    };
  }
  delete<T = unknown, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R> {
    return this.forEachMethodNoData<T, R, D>('delete')(url, config)
  }
  get<T = unknown, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R> {
    return this.forEachMethodNoData<T, R, D>('get')(url, config)
  }
  head<T = unknown, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R> {
    return this.forEachMethodNoData<T, R, D>('head')(url, config)
  }
  options<T = unknown, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R> {
    return this.forEachMethodNoData<T, R, D>('options')(url, config)
  }
  post<T = unknown, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R> {
    return this.forEachMethodWithData<T, R, D>('post')(url, data, config)
  }
  put<T = unknown, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R> {
    return this.forEachMethodWithData<T, R, D>('put')(url, data, config)
  }
  patch<T = unknown, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R> {
    return this.forEachMethodWithData<T, R, D>('patch')(url, data, config)
  }

  // private generateMethodNoData() {
  //   ['delete', 'get','head', 'options'].map((method) => this[method] = <T = unknown, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R> => this.forEachMethodNoData<T, R, D>(method)(url, config))
  // }
  // private generateMethodData() {
  //   const methods = ['post', 'put','patch']
  //   methods.map((method) => this[method as 'post'| 'put'|'patch'] = <T = unknown, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R> => this.forEachMethodNoData<T, R, D>(method)(url, config))
  // }
}
const obj: Record<string, any> = {};
['request', 'get', 'getUri', 'delete', 'head', 'options', 'post', 'put', 'patch'].map(method => obj[method] = {
  enumerable: true,
})
Object.defineProperties(Axios.prototype, obj)
export default Axios;

