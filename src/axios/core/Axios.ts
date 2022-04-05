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

  constructor(config: AxiosRequestConfig) {
    this.defaults = config;
  }
  /**
   * @example
   * T: response.data类型
   * D: request config.data类型
   */  
  request<T = unknown, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | string): Promise<R> {
    if (typeof config === 'string') {
      // 如果是config是string，说明是url，那么cofig尝试获取第二个参数，如果没有给个默认空对象
      config = (arguments[1] || {}) as AxiosRequestConfig<D>;
      // 然后将url加到config上
      config.url = arguments[0];
    } else {
      config = config || {};
    }
    // createInstance已经有extend(instance, context),所以这里this.defaults有值，
    // 而我们get、post等传入第二个参数config可以覆盖默认的配置
    config = mergeConfig(this.defaults, config);
    // Set config.method
    // 注意这里把method转换为小写，目的是在dispatchRequest中可以匹配到config.headers![method]对应method的header，
    // 而真正的请求是要把method转换为大写的，可以在adapters中看到
    if (config.method) {
      // 如果有method，那么转换为小写，如GET => get
      config.method = config.method.toLowerCase() as Method;
    } else if (this.defaults.method) {
      // 如果config没有method而default有，那么用默认的method
      config.method = this.defaults.method.toLowerCase() as Method;
    } else {
      // config和defaults都没有，那么统一设置为get
      config.method = 'get';
    }

    const transitional = config.transitional;
    // 验证transitional是否正确
    if (transitional !== undefined) {
      validator.assertOptions(transitional, {
        silentJSONParsing: validators.transitional(validators.boolean),
        forcedJSONParsing: validators.transitional(validators.boolean),
        clarifyTimeoutError: validators.transitional(validators.boolean)
      }, false);
    }

    // filter out skipped interceptors
    // 请求拦截器
    const requestInterceptorChain: any[] = [];
    // 请求拦截器是否是同步的，其实大部分情况下都是异步的
    let synchronousRequestInterceptors = true;
    // 遍历请求拦截器
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      // 如果有runWhen且执行结果为false，那么不放入requestInterceptorChain
      if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config as AxiosRequestConfig<D>) === false) {
        return;
      }
      // 只要有一个是异步的,即只要有一个synchronous为false，那么全部就都是异步的
      synchronousRequestInterceptors = !!(synchronousRequestInterceptors && interceptor.synchronous);
      /**
       * request.use(fulfilled1, rejected1)
       * request.use(fulfilled2, rejected2)
       * 
       * 那么最终 requestInterceptorChain = [fulfilled2, rejected2, fulfilled1, rejected1,]
       */
      requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
    });
    // 响应拦截器
    const responseInterceptorChain: any[] = [];
    // 遍历响应拦截器
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });

    let promise;
    if (!synchronousRequestInterceptors) {
      // 到了这里说明有配置了请求拦截器，但有至少一个拦截器是异步的
      // 由于下面要生成promise链，且promise.then有两个回调参数，故这里增加一个undefined，使之成对
      let chain = [dispatchRequest, undefined];
      // 将request放chain前，response放后，
      // 即newChain = [...requestInterceptorChain, ...chain, ...responseInterceptorChain]
      // eg: const a = [1];Array.prototype.unshift.apply(a, [2, 3]); a = [2, 3, 1]
      // eg: const a = [1];a.unshift(2, 3); a = [2, 3, 1]
      Array.prototype.unshift.apply(chain, requestInterceptorChain);
      chain = chain.concat(responseInterceptorChain);

      promise = Promise.resolve(config);
      debugger
      // 然后循环生成promise
      while (chain.length) {
        /**
         * 比如chain = [fulfilled1, rejected1, dispatchRequest, undefined, fulfilled2, rejected2]
         * 那么这里就是:
         * Promise
         * .resolve(config)
         * .then(fulfilled1, rejected1)
         * .then(dispatchRequest, undefined)
         * .then(fulfilled2, rejected2)
         * 
         * fullFilled，dispatchRequest会接收到config，每个函数返回处理好的新的config
         */
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise as Promise<R>;
    }

    // 到了这里就是同步的拦截器了
    // synchronousRequestInterceptors为true可能的3种情况是：
    // 1.没有请求拦截器
    // 2.有请求拦截器拦截器但每个拦截器都设置了synchronous为true，
    // 3或者每个请求拦截器都设置了runWhen但都返回false，下面的
    // synchronousRequestInterceptors = !!(synchronousRequestInterceptors && interceptor.synchronous)就不会走到
    // 和上面不同，对于请求拦截器，会同步执行，之后dispatchRequest和responseInterceptorChain才会异步处理
    // 生成链式promise
    let newConfig = config;
    while (requestInterceptorChain.length) {
      const onFulfilled = requestInterceptorChain.shift();
      const onRejected = requestInterceptorChain.shift();
      try {
        // onFulfilled生成新的config
        newConfig = onFulfilled(newConfig);
      } catch (error) {
        // 执行过程中错误就调用对应的onRejected
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
  /** 
   * 根据传入的请求配置对象返回一个请求的url
   * 
   * @example
   * 
   * const config = {
   *   url: "/user/xxx",
   *   params: {
   *     a: 1,
   *     b: 2,
   *     c: 3
   *   }
   * };
   * console.log(axios.getUri(config)); // /user/xxx?a=1&b=2&c=3
   *  */
  getUri(config: AxiosRequestConfig): string {
    config = mergeConfig(this.defaults, config);
    // 有可能url为'',params不为空，那么得到的是?a=1&b=2,要去掉开头的?
    return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
  };

  private forEachMethodNoData<T = unknown, R = AxiosResponse<T>, D = any>(method: 'delete' | 'get' | 'head' | 'options') {
    return (url: string, config?: AxiosRequestConfig<D>) => {
      // url和method会merge到config里面
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
// 类型形式无法for in Axios.prototype的属性，所以这里设置对应的方法的enumerable为true
const obj: Record<string, any> = {};
['request', 'get', 'getUri', 'delete', 'head', 'options', 'post', 'put', 'patch'].map(method => obj[method] = {
  enumerable: true,
})
Object.defineProperties(Axios.prototype, obj)
export default Axios;

